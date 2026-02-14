import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { ok } from "@/lib/platform/api-response";

export const dynamic = "force-dynamic";

const protectedGet = withTenantProtection(
    {
        route: "/api/mobile/history",
        roles: ["WORKER", "ASSISTANT", "AGENT", "MANAGER", "ADMIN", "SUPER_ADMIN"],
        rateLimit: { keyPrefix: "mobile-history-read", max: 120, windowMs: 60_000 },
    },
    async (_req, ctx) => {
        const reports = await ctx.scopedPrisma.dailyReport.findMany({
            where: { userId: ctx.sessionUser.id },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        const leaves = await ctx.scopedPrisma.leaveRequest.findMany({
            where: { userId: ctx.sessionUser.id },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        const sales = await ctx.scopedPrisma.sale.findMany({
            where: { userId: ctx.sessionUser.id },
            orderBy: { createdAt: "desc" },
            take: 20,
            include: { items: { include: { product: true } } },
        });

        return ok({ reports, leaves, sales });
    }
);

export async function GET(req: Request) {
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
    return withApiErrorHandling(req, "/api/mobile/history", requestId, () => protectedGet(req));
}
