import { z } from "zod";
import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { fail, ok } from "@/lib/platform/api-response";
import { parseQuery } from "@/lib/platform/validation";

export const dynamic = "force-dynamic";

const querySchema = z
    .object({
        userId: z.string().optional(),
        action: z.string().optional(),
        entity: z.string().optional(),
        shopId: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(500).optional(),
        offset: z.coerce.number().int().min(0).optional(),
    })
    .strip();

const protectedGet = withTenantProtection(
    {
        route: "/api/activity-log",
        roles: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
        rateLimit: { keyPrefix: "activity-log-read", max: 120, windowMs: 60_000 },
    },
    async (req, ctx) => {
        const query = parseQuery(new URL(req.url), querySchema);
        const limit = query.limit ?? 100;
        const offset = query.offset ?? 0;

        const where: any = {};
        if (query.userId) where.userId = query.userId;
        if (query.action) where.action = query.action;
        if (query.entity) where.entity = query.entity;

        if (ctx.sessionUser.role !== "SUPER_ADMIN") {
            if (!ctx.orgId) {
                return fail("BAD_REQUEST", "Organization context missing", 400);
            }

            const userShops = await ctx.scopedPrisma.shop.findMany({
                select: { id: true },
            });
            const shopIds = userShops.map((shop) => shop.id);

            if (query.shopId) {
                if (!shopIds.includes(query.shopId)) {
                    return fail("FORBIDDEN", "Access denied to requested hub", 403);
                }
                where.shopId = query.shopId;
            } else {
                where.shopId = { in: shopIds };
            }
        } else if (query.shopId) {
            where.shopId = query.shopId;
        }

        const [logs, total] = await Promise.all([
            ctx.scopedPrisma.activityLog.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: offset,
            }),
            ctx.scopedPrisma.activityLog.count({ where }),
        ]);

        return ok({ data: logs, total, limit, offset });
    }
);

export async function GET(req: Request) {
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
    return withApiErrorHandling(req, "/api/activity-log", requestId, () => protectedGet(req));
}
