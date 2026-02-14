import { z } from "zod";
import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { ok } from "@/lib/platform/api-response";
import { parseJsonBody, parseQuery } from "@/lib/platform/validation";
import { logActivity } from "@/lib/activity-logger";

export const dynamic = "force-dynamic";

const reportPostSchema = z
  .object({
    walkIns: z.coerce.number().int().min(0).default(0),
    inquiries: z.coerce.number().int().min(0).default(0),
    buyers: z.coerce.number().int().min(0).optional(),
    conversions: z.coerce.number().int().min(0).optional(),
    marketIntel: z.string().max(10_000).optional().nullable(),
    stockGaps: z.string().max(10_000).optional().nullable(),
    notes: z.string().max(5_000).optional().nullable(),
  })
  .strip();

const reportQuerySchema = z
  .object({
    promoterOnly: z.string().optional(),
    shopId: z.string().optional(),
  })
  .strip();

const protectedPost = withTenantProtection(
  {
    route: "/api/operations/reports",
    roles: ["WORKER", "AGENT", "ASSISTANT", "MANAGER", "ADMIN", "SUPER_ADMIN"],
    rateLimit: { keyPrefix: "operations-reports-write", max: 40, windowMs: 60_000 },
  },
  async (req, ctx) => {
    const body = await parseJsonBody(req, reportPostSchema);
    const buyersNum = Number(body.conversions ?? body.buyers ?? 0) || 0;

    const dbUser = await ctx.scopedPrisma.user.findUnique({
      where: { id: ctx.sessionUser.id },
      select: { shopId: true, shop: { select: { id: true, name: true } } },
    });

    const report = await ctx.scopedPrisma.dailyReport.create({
      data: {
        userId: ctx.sessionUser.id,
        shopId: dbUser?.shopId || null,
        walkIns: body.walkIns,
        inquiries: body.inquiries,
        buyers: buyersNum,
        marketIntel: body.marketIntel ?? null,
        stockGaps: body.stockGaps ?? null,
        notes: body.notes ?? null,
      },
      include: { user: { include: { shop: true } } },
    });

    await logActivity({
      userId: ctx.sessionUser.id,
      userName: ctx.sessionUser.email,
      userRole: ctx.sessionUser.role,
      action: "DAILY_REPORT_SUBMITTED",
      entity: "DailyReport",
      entityId: report.id,
      description: `Submitted daily report: ${body.walkIns} walk-ins, ${buyersNum} buyers${body.marketIntel ? ", with competitor intel" : ""}`,
      metadata: { walkIns: body.walkIns, inquiries: body.inquiries, buyers: buyersNum, hasIntel: Boolean(body.marketIntel) },
      ipAddress: ctx.ip,
      shopId: dbUser?.shopId || undefined,
      shopName: dbUser?.shop?.name || undefined,
    });

    return ok(report, 201);
  }
);

const protectedGet = withTenantProtection(
  {
    route: "/api/operations/reports",
    roles: ["MANAGER", "ADMIN", "SUPER_ADMIN", "AUDITOR"],
    rateLimit: { keyPrefix: "operations-reports-read", max: 120, windowMs: 60_000 },
  },
  async (req, ctx) => {
    const query = parseQuery(new URL(req.url), reportQuerySchema);
    const promoterOnly = query.promoterOnly === "true";

    const whereClause: Record<string, unknown> = {};
    if (query.shopId) {
      whereClause.shopId = query.shopId;
    }
    if (promoterOnly) {
      whereClause.user = { role: "PROMOTER" };
    }

    const reports = await ctx.scopedPrisma.dailyReport.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, image: true, role: true, shop: { select: { id: true, name: true } } } },
        shop: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return ok(reports);
  }
);

export async function POST(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/operations/reports", requestId, () => protectedPost(req));
}

export async function GET(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/operations/reports", requestId, () => protectedGet(req));
}
