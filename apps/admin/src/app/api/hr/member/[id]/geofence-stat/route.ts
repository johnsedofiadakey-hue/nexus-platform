import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { ok } from "@/lib/platform/api-response";

export const dynamic = 'force-dynamic';

const protectedGet = withTenantProtection(
  {
    route: "/api/hr/member/[id]/geofence-stat",
    roles: ["ADMIN", "SUPER_ADMIN", "MANAGER"],
    rateLimit: { keyPrefix: "geofence-stat", max: 60, windowMs: 60_000 },
  },
  async (req, ctx) => {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const memberId = pathParts[pathParts.indexOf("member") + 1];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Verify user belongs to same org
    const user = await ctx.scopedPrisma.user.findUnique({ where: { id: memberId } });
    if (!user) return ok([]);

    const logs = await ctx.scopedPrisma.disciplinaryRecord.findMany({
      where: {
        userId: memberId,
        type: 'GEOFENCE_BREACH',
        createdAt: { gte: sevenDaysAgo }
      },
      orderBy: { createdAt: 'asc' }
    });

    const stats = logs.reduce((acc: any, log) => {
      const day = new Date(log.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    return ok(Object.entries(stats).map(([name, breaches]) => ({ name, breaches })));
  }
);

export async function GET(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/hr/member/[id]/geofence-stat", requestId, () => protectedGet(req));
}