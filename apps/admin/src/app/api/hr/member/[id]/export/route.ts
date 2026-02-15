import { z } from "zod";
import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { fail } from "@/lib/platform/api-response";
import { parseQuery } from "@/lib/platform/validation";

export const dynamic = "force-dynamic";

const exportQuerySchema = z
    .object({
        type: z.enum(["full", "attendance_registry"]).optional(),
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

function resolveRange(from?: string, to?: string) {
    if (!from && !to) return null;

    const fromDate = from ? new Date(from) : new Date(0);
    const toDateBase = to ? new Date(to) : new Date();
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDateBase.getTime())) return null;

    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(toDateBase);
    toDate.setHours(23, 59, 59, 999);
    return { fromDate, toDate };
}

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

    return withApiErrorHandling(req, "/api/hr/member/[id]/export", requestId, async () => {
        const { id } = await props.params;

        const protectedGet = withTenantProtection(
            {
                route: "/api/hr/member/[id]/export",
                roles: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
                rateLimit: { keyPrefix: "hr-member-export", max: 20, windowMs: 60_000 },
            },
            async (_request, ctx) => {
                const query = parseQuery(new URL(req.url), exportQuerySchema);
                const exportType = query.type || "full";
                const range = resolveRange(query.from, query.to);

                const whereClause: any = { id };
                if (ctx.sessionUser.role !== "SUPER_ADMIN" && ctx.orgId) {
                    whereClause.organizationId = ctx.orgId;
                }

                const user = await ctx.scopedPrisma.user.findFirst({
                    where: whereClause,
                    include: {
                        sales: { orderBy: { createdAt: "desc" }, take: 1000 },
                        attendance: { orderBy: { date: "desc" }, take: 1000 },
                        dailyReports: { orderBy: { createdAt: "desc" }, take: 1000 },
                        shop: true,
                    },
                });

                if (!user) {
                    return fail("NOT_FOUND", "User not found", 404);
                }

                if (exportType === "attendance_registry") {
                    const attendanceRows = (user.attendance || []).filter((entry: any) => {
                        if (!range) return true;
                        const d = new Date(entry.date);
                        return d >= range.fromDate && d <= range.toDate;
                    });

                    const rows: string[] = [];
                    rows.push([
                        "Date",
                        "Promoter",
                        "Email",
                        "Status",
                        "Check In",
                        "Check Out",
                        "On-Site Hours",
                        "Session Type"
                    ].join(","));

                    attendanceRows.forEach((attendance: any) => {
                        const checkIn = new Date(attendance.checkIn);
                        const checkOut = attendance.checkOut ? new Date(attendance.checkOut) : null;
                        const endPoint = checkOut ?? new Date();
                        const durationHours = Math.max(0, (endPoint.getTime() - checkIn.getTime()) / (1000 * 60 * 60));
                        const sessionType = attendance.note?.includes("AUTO_CLOCK") ? "AUTO_GEOFENCE" : "MANUAL";

                        rows.push([
                            escapeCsv(new Date(attendance.date).toLocaleDateString()),
                            escapeCsv(user.name || "Unknown"),
                            escapeCsv(user.email || ""),
                            escapeCsv(attendance.status || ""),
                            escapeCsv(checkIn.toLocaleTimeString()),
                            escapeCsv(checkOut ? checkOut.toLocaleTimeString() : "-"),
                            escapeCsv(durationHours.toFixed(2)),
                            escapeCsv(sessionType),
                        ].join(","));
                    });

                    const fromLabel = range?.fromDate.toISOString().split("T")[0];
                    const toLabel = range?.toDate.toISOString().split("T")[0];
                    const rangeSuffix = fromLabel && toLabel ? `${fromLabel}_to_${toLabel}` : new Date().toISOString().split("T")[0];

                    return new Response(rows.join("\n"), {
                        status: 200,
                        headers: {
                            "Content-Type": "text/csv",
                            "Content-Disposition": `attachment; filename=\"attendance_registry_${(user.name || "promoter").replace(/\s+/g, "_")}_${rangeSuffix}.csv\"`,
                        },
                    });
                }

                const rows: Array<Array<string | number>> = [];
                rows.push(["NEXUS INTELLIGENCE REPORT", `AGENT: ${user.name}`, `GENERATED: ${new Date().toISOString()}`]);
                rows.push([]);

                rows.push(["--- PERFORMANCE SUMMARY ---"]);
                rows.push(["Metric", "Value"]);
                rows.push(["Total Sales Count", user.sales.length]);
                rows.push(["Total Revenue", user.sales.reduce((acc, sale) => acc + sale.totalAmount, 0)]);
                rows.push(["Attendance Records", user.attendance.length]);
                rows.push(["Reports Filed", user.dailyReports.length]);
                rows.push([]);

                rows.push(["--- RECENT SALES ---"]);
                rows.push(["Date", "Sale ID", "Amount", "Items"]);
                user.sales.forEach((sale) => {
                    rows.push([new Date(sale.createdAt).toLocaleDateString(), sale.id.slice(-6), sale.totalAmount, "N/A"]);
                });
                rows.push([]);

                rows.push(["--- ATTENDANCE LOG ---"]);
                rows.push(["Date", "Status", "Check In", "Check Out", "Duration (Hrs)", "Location"]);
                user.attendance.forEach((attendance) => {
                    const duration = attendance.checkOut
                        ? ((new Date(attendance.checkOut).getTime() - new Date(attendance.checkIn).getTime()) / (1000 * 60 * 60)).toFixed(2)
                        : "-";

                    rows.push([
                        new Date(attendance.date).toLocaleDateString(),
                        attendance.status,
                        new Date(attendance.checkIn).toLocaleTimeString(),
                        attendance.checkOut ? new Date(attendance.checkOut).toLocaleTimeString() : "-",
                        duration,
                        "N/A",
                    ]);
                });

                const csvContent = rows.map((entry) => entry.join(",")).join("\n");
                return new Response(csvContent, {
                    status: 200,
                    headers: {
                        "Content-Type": "text/csv",
                        "Content-Disposition": `attachment; filename=\"nexus_report_${user.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv\"`,
                    },
                });
            }
        );

        return protectedGet(req);
    });
}
