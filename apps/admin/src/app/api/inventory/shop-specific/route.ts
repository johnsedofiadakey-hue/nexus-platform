import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { ok } from "@/lib/platform/api-response";

export const dynamic = "force-dynamic";

const protectedGet = withTenantProtection(
  {
    route: "/api/inventory/shop-specific",
    roles: ["WORKER", "AGENT", "ASSISTANT", "MANAGER", "ADMIN", "SUPER_ADMIN"],
    rateLimit: { keyPrefix: "inventory-shop-specific-read", max: 120, windowMs: 60_000 },
  },
  async (_req, ctx) => {
    if (!ctx.sessionUser.shopId) {
      return ok([]);
    }

    const inventory = await ctx.scopedPrisma.product.findMany({
      where: {
        shopId: ctx.sessionUser.shopId,
        stockLevel: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        barcode: true,
        sellingPrice: true,
        stockLevel: true,
        category: true,
      },
      orderBy: { name: "asc" },
    });

    return ok(inventory);
  }
);

export async function GET(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/inventory/shop-specific", requestId, () => protectedGet(req));
}