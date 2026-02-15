import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { ok } from "@/lib/platform/api-response";
import { resolveStrictStatus } from "@/lib/attendance/strict-status";

export const dynamic = "force-dynamic";

const protectedGet = withTenantProtection(
  {
    route: "/api/hr/team/list",
    roles: ["MANAGER", "ADMIN", "SUPER_ADMIN", "AUDITOR"],
    rateLimit: { keyPrefix: "hr-team-list-read", max: 120, windowMs: 60_000 },
  },
  async (_req, ctx) => {
    const staff = await ctx.scopedPrisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        role: true,
        email: true,
        phone: true,
        status: true,
        lastLat: true,
        lastLng: true,
        lastSeen: true,
        shopId: true,
        isInsideZone: true,
        image: true,
        shop: {
          select: {
            id: true,
            name: true,
            location: true,
            latitude: true,
            longitude: true,
            radius: true,
          },
        },
        attendance: {
          take: 1,
          orderBy: { date: "desc" },
          select: { checkIn: true },
        },
      },
    });

    const formattedTeam = staff.map((user) => {
      const strictAttendanceStatus = resolveStrictStatus(Boolean(user.isInsideZone), user.lastSeen, new Date());

      return {
      id: user.id,
      name: user.name || "Unknown Agent",
      role: user.role,
      email: user.email,
      phone: user.phone,
      status: user.status === "ACTIVE" ? "Active" : "Offline",
      shop: user.shop ? { id: user.shop.id, name: user.shop.name } : null,
      shopId: user.shopId,
      image: user.image,
      lastSeen: user.lastSeen,
      lastLat: user.lastLat,
      lastLng: user.lastLng,
      location: user.shop
        ? {
            lat: user.shop.latitude || 5.6037,
            lng: user.shop.longitude || -0.187,
          }
        : { lat: 5.6037, lng: -0.187 },
      lastActive: user.lastSeen || user.attendance[0]?.checkIn || new Date(),
      isInsideZone: user.isInsideZone || false,
      strictAttendanceStatus,
      };
    });

    return ok({
      items: formattedTeam,
      meta: { total: staff.length },
    });
  }
);

/**
 * 🛰️ NEXUS TEAM REGISTRY API
 * Hardened with retry logic for Supabase connection resilience.
 * 🔒 SECURED: Enforces authentication and multi-tenancy isolation
 */
export async function GET(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/hr/team/list", requestId, () => protectedGet(req));
}