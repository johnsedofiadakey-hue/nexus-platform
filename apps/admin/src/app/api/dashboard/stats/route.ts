import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { ok } from "@/lib/platform/api-response";

export const dynamic = "force-dynamic";

const protectedGet = withTenantProtection(
    {
        route: "/api/dashboard/stats",
        roles: ["MANAGER", "ADMIN", "SUPER_ADMIN", "AUDITOR"],
        rateLimit: { keyPrefix: "dashboard-stats-read", max: 120, windowMs: 60_000 },
    },
    async (_req, ctx) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const allPromoters = await ctx.scopedPrisma.user.findMany({
            where: {
                role: { in: ["PROMOTER", "AGENT", "WORKER", "ASSISTANT"] },
                status: "ACTIVE",
            },
            select: {
                id: true,
                name: true,
                lastLat: true,
                lastLng: true,
                lastSeen: true,
                status: true,
                shop: { select: { name: true } },
            },
        });

        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const onlineCount = allPromoters.filter((agent) => agent.lastSeen && agent.lastSeen > fiveMinutesAgo).length;
        const offlineCount = allPromoters.length - onlineCount;

        const salesStats = await ctx.scopedPrisma.sale.aggregate({
            where: { createdAt: { gte: today } },
            _sum: { totalAmount: true },
            _count: { id: true },
        });

        const topPerformersData = await ctx.scopedPrisma.sale.groupBy({
            by: ["userId"],
            where: { createdAt: { gte: today } },
            _sum: { totalAmount: true },
            _count: { id: true },
            orderBy: { _sum: { totalAmount: "desc" } },
            take: 5,
        });

        const performerIds = topPerformersData.map((performer) => performer.userId);
        const performers = await ctx.scopedPrisma.user.findMany({
            where: { id: { in: performerIds } },
            select: { id: true, name: true, image: true },
        });

        const topPerformers = topPerformersData.map((performer) => {
            const user = performers.find((candidate) => candidate.id === performer.userId);
            return {
                id: performer.userId,
                name: user?.name || "Unknown",
                image: user?.image,
                totalSales: performer._sum.totalAmount || 0,
                transactionCount: performer._count.id,
            };
        });

        const shopCount = await ctx.scopedPrisma.shop.count({
            where: { status: "ACTIVE" },
        });

        return ok({
            agents: allPromoters.map((agent) => ({
                id: agent.id,
                name: agent.name,
                location: agent.shop?.name || "Roaming",
                status: agent.lastSeen && agent.lastSeen > fiveMinutesAgo ? "ONLINE" : "OFFLINE",
                lat: agent.lastLat,
                lng: agent.lastLng,
                lastSeen: agent.lastSeen,
            })),
            stats: {
                onlineAgents: onlineCount,
                offlineAgents: offlineCount,
                totalPromoters: allPromoters.length,
                totalSales: salesStats._sum.totalAmount || 0,
                totalTransactions: salesStats._count.id,
                activeShops: shopCount,
                topPerformers,
            },
        });
    }
);

export async function GET(req: Request) {
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
    return withApiErrorHandling(req, "/api/dashboard/stats", requestId, () => protectedGet(req));
}
