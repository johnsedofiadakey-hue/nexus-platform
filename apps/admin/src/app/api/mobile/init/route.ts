import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { fail, ok } from "@/lib/platform/api-response";

export const dynamic = "force-dynamic";

const protectedGet = withTenantProtection(
  {
    route: "/api/mobile/init",
    roles: ["WORKER", "ASSISTANT", "AGENT", "MANAGER", "ADMIN", "SUPER_ADMIN"],
    rateLimit: { keyPrefix: "mobile-init-read", max: 120, windowMs: 60_000 },
  },
  async (_req, ctx) => {
    const user = await ctx.scopedPrisma.user.findUnique({
      where: { id: ctx.sessionUser.id },
      include: { shop: true },
    }) as any;

    if (!user) {
      return fail("NOT_FOUND", "Agent not found", 404);
    }

    if (!user.shop) {
      if (user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.role === "MANAGER") {
        return ok({
          id: user.id,
          agentName: user.name,
          agentImage: user.image,
          shopId: null,
          shopName: "Roaming Admin",
          shopLat: 5.6037,
          shopLng: -0.1870,
          radius: 5000,
          managerName: "Self",
          managerPhone: user.phone || "",
          bypassGeofence: true,
        });
      }

      return fail("UNASSIGNED", "No shop assigned. Contact your administrator.", 409);
    }

    const manager = await ctx.scopedPrisma.user.findFirst({
      where: { shopId: user.shop.id, role: "ADMIN" },
    });

    const today = new Date();
    const activeLeave = await ctx.scopedPrisma.leaveRequest.findFirst({
      where: {
        userId: user.id,
        status: "APPROVED",
        startDate: { lte: today },
        endDate: { gte: today },
      },
    });

    const activeTarget = await ctx.scopedPrisma.target.findFirst({
      where: {
        userId: user.id,
        status: "ACTIVE",
        startDate: { lte: today },
        endDate: { gte: today },
      },
      orderBy: { createdAt: "desc" },
    });

    let targetProgress = null;
    if (activeTarget) {
      const sales = await ctx.scopedPrisma.sale.findMany({
        where: {
          userId: user.id,
          createdAt: { gte: activeTarget.startDate, lte: activeTarget.endDate },
        },
        include: { items: true },
      });

      const achievedValue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const achievedQty = sales.reduce((sum, sale) => sum + sale.items.reduce((qty, item) => qty + item.quantity, 0), 0);

      targetProgress = {
        targetValue: activeTarget.targetValue,
        targetQuantity: activeTarget.targetQuantity,
        achievedValue,
        achievedQuantity: achievedQty,
      };
    }

    const lockout = activeLeave
      ? { active: true, reason: "LEAVE", endDate: activeLeave.endDate }
      : null;

    if (user.status === "SUSPENDED") {
      return fail("FORBIDDEN", "ACCOUNT_SUSPENDED", 403);
    }

    return ok({
      id: user.id,
      agentName: user.name,
      agentImage: user.image,
      shopId: user.shop.id,
      shopName: user.shop.name,
      shopLat: Number(user.shop.latitude),
      shopLng: Number(user.shop.longitude),
      radius: Number(user.shop.radius ?? 100),
      managerName: user.shop.managerName || manager?.name || "HQ Admin",
      managerPhone: user.shop.managerContact || manager?.phone || "N/A",
      lockout,
      targetProgress,
      bypassGeofence: user.bypassGeofence,
    });
  }
);

export async function GET(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/mobile/init", requestId, () => protectedGet(req));
}
