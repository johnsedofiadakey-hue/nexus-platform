import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { ok } from "@/lib/platform/api-response";

export const dynamic = "force-dynamic";

const protectedGet = withTenantProtection(
  {
    route: "/api/shops/list",
    roles: ["MANAGER", "ADMIN", "SUPER_ADMIN", "AUDITOR"],
    rateLimit: { keyPrefix: "shops-list-read", max: 120, windowMs: 60_000 },
  },
  async (_req, ctx) => {
    const shops = await ctx.scopedPrisma.shop.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        location: true,
        latitude: true,
        longitude: true,
        radius: true,
        openingTime: true,
        phone: true,
        _count: {
          select: {
            products: true,
            users: true,
          },
        },
        users: {
          where: { role: "MANAGER" },
          take: 1,
          select: { name: true, phone: true },
        },
      },
    });

    const formattedShops = shops.map((shop) => ({
      id: shop.id,
      name: shop.name,
      location: shop.location || "",
      latitude: shop.latitude || 0,
      longitude: shop.longitude || 0,
      radius: shop.radius || 200,
      managerName: shop.users[0]?.name || "",
      managerPhone: shop.phone || shop.users[0]?.phone || "",
      openingTime: shop.openingTime || "08:00 AM",
      contact: shop.phone || shop.users[0]?.phone || "N/A",
      inventoryCount: shop._count.products,
      geo: {
        lat: shop.latitude || 5.6037,
        lng: shop.longitude || -0.187,
        radius: shop.radius || 50,
      },
      _count: shop._count,
    }));

    return ok(formattedShops);
  }
);

// ----------------------------------------------------------------------
// 1. GET: FETCH ALL SHOPS (Registry Grid)
// ----------------------------------------------------------------------
export async function GET(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/shops/list", requestId, () => protectedGet(req));
}