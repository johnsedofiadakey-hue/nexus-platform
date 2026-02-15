import { z } from "zod";
import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { parseQuery } from "@/lib/platform/validation";

export const dynamic = "force-dynamic";

const exportQuerySchema = z
  .object({
    date: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  })
  .strip();

function escapeCsv(value: unknown): string {
  const raw = String(value ?? "");
  if (raw.includes(",") || raw.includes("\n") || raw.includes("\"")) {
    return `"${raw.replace(/\"/g, '""')}"`;
  }
  return raw;
}

function dayRange(inputDate?: string) {
  const base = inputDate ? new Date(inputDate) : new Date();
  if (Number.isNaN(base.getTime())) {
    const fallback = new Date();
    fallback.setHours(0, 0, 0, 0);
    const end = new Date(fallback);
    end.setDate(end.getDate() + 1);
    return { start: fallback, end, label: fallback.toISOString().split("T")[0] };
  }

  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end, label: start.toISOString().split("T")[0] };
}

function rangeWindow(params: { date?: string; from?: string; to?: string }) {
  if (params.from || params.to) {
    const from = params.from ? new Date(params.from) : new Date(0);
    const toBase = params.to ? new Date(params.to) : new Date();

    if (Number.isNaN(from.getTime()) || Number.isNaN(toBase.getTime())) {
      const fallback = dayRange(params.date);
      return {
        start: fallback.start,
        end: fallback.end,
        label: fallback.label,
      };
    }

    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(toBase);
    end.setHours(23, 59, 59, 999);

    const startLabel = start.toISOString().split("T")[0];
    const endLabel = end.toISOString().split("T")[0];
    const label = startLabel === endLabel ? startLabel : `${startLabel}_to_${endLabel}`;

    return {
      start,
      end,
      label,
    };
  }

  const single = dayRange(params.date);
  return {
    start: single.start,
    end: new Date(single.end.getTime() - 1),
    label: single.label,
  };
}

const protectedGet = withTenantProtection(
  {
    route: "/api/hr/attendance/export",
    roles: ["MANAGER", "ADMIN", "SUPER_ADMIN", "AUDITOR"],
    rateLimit: { keyPrefix: "hr-attendance-export", max: 20, windowMs: 60_000 },
  },
  async (req, ctx) => {
    const query = parseQuery(new URL(req.url), exportQuerySchema);
    const { start, end, label } = rangeWindow({ date: query.date, from: query.from, to: query.to });

    const logs = await ctx.scopedPrisma.attendance.findMany({
      where: {
        date: { gte: start, lte: end },
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: [{ date: "asc" }, { checkIn: "asc" }],
      take: 10000,
    });

    const rows: string[] = [];
    rows.push([
      "Date",
      "Agent Name",
      "Email",
      "Role",
      "Status",
      "Check In",
      "Check Out",
      "On-Site Hours",
      "Session Type",
    ].join(","));

    logs.forEach((log) => {
      const checkIn = new Date(log.checkIn);
      const checkOut = log.checkOut ? new Date(log.checkOut) : null;
      const endPoint = checkOut ?? new Date();
      const durationHours = Math.max(0, (endPoint.getTime() - checkIn.getTime()) / (1000 * 60 * 60));
      const sessionType = log.note?.includes("AUTO_CLOCK") ? "AUTO_GEOFENCE" : "MANUAL";

      rows.push([
        escapeCsv(new Date(log.date).toLocaleDateString()),
        escapeCsv(log.user?.name || "Unknown"),
        escapeCsv(log.user?.email || ""),
        escapeCsv(log.user?.role || ""),
        escapeCsv(log.status || ""),
        escapeCsv(checkIn.toLocaleTimeString()),
        escapeCsv(checkOut ? checkOut.toLocaleTimeString() : "-") ,
        escapeCsv(durationHours.toFixed(2)),
        escapeCsv(sessionType),
      ].join(","));
    });

    const csvContent = rows.join("\n");
    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=\"attendance_registry_${label}.csv\"`,
      },
    });
  }
);

export async function GET(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/hr/attendance/export", requestId, () => protectedGet(req));
}
