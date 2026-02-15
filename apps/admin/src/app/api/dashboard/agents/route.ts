import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { ok } from "@/lib/platform/api-response";

export const dynamic = "force-dynamic";

const protectedGet = withTenantProtection(
    {
        route: "/api/dashboard/agents",
        roles: ["MANAGER", "ADMIN", "SUPER_ADMIN", "AUDITOR"],
        rateLimit: { keyPrefix: "dashboard-agents-read", max: 120, windowMs: 60_000 },
    },
    async (_req, ctx) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const agents = await ctx.scopedPrisma.user.findMany({
            where: {
                role: { in: ["PROMOTER", "AGENT", "WORKER", "ASSISTANT"] },
                status: "ACTIVE",
            },
            select: {
                id: true,
                name: true,
                role: true,
                lastSeen: true,
                isInsideZone: true,
                shop: { select: { name: true } },
                attendance: {
                    where: { date: { gte: today } },
                    orderBy: { checkIn: "desc" },
                    select: { checkIn: true, checkOut: true },
                },
            },
            orderBy: { name: "asc" },
        });

        const salesCounts = await ctx.scopedPrisma.sale.groupBy({
            by: ["userId"],
            where: {
                userId: { in: agents.map((agent) => agent.id) },
                createdAt: { gte: today },
            },
            _count: true,
        });

        const salesMap = new Map(salesCounts.map((sales) => [sales.userId, sales._count]));
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const formatted = agents.map((agent) => {
            const isOnline = agent.lastSeen ? agent.lastSeen > fiveMinutesAgo : false;
            const activeAttendance = agent.attendance.find((entry) => !entry.checkOut) || null;
            const totalOnSiteSecondsToday = agent.attendance.reduce((total, entry) => {
                const end = entry.checkOut || new Date();
                const seconds = Math.max(0, Math.floor((end.getTime() - entry.checkIn.getTime()) / 1000));
                return total + seconds;
            }, 0);

            return {
                id: agent.id,
                name: agent.name,
                role: agent.role,
                shopName: agent.shop?.name || "Unassigned",
                isOnline,
                lastSeen: agent.lastSeen,
                salesToday: salesMap.get(agent.id) || 0,
                attendanceStatus: agent.isInsideZone ? "ON_SITE" : "OFF_SITE",
                clockInTime: activeAttendance?.checkIn || null,
                totalOnSiteSecondsToday,
            };
        });

        return ok(formatted);
    }
);

export async function GET(req: Request) {
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
    return withApiErrorHandling(req, "/api/dashboard/agents", requestId, () => protectedGet(req));
}
