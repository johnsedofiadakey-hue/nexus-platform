import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { ok } from "@/lib/platform/api-response";

export const dynamic = "force-dynamic";

const protectedGet = withTenantProtection(
  {
    route: "/api/analytics/sales-mix",
    roles: ["MANAGER", "ADMIN", "SUPER_ADMIN", "AUDITOR"],
    rateLimit: { keyPrefix: "analytics-sales-mix-read", max: 90, windowMs: 60_000 },
  },
  async (_req, ctx) => {
    const sales = await ctx.scopedPrisma.sale.findMany({
      include: {
        shop: { select: { name: true } },
        items: { include: { product: { select: { category: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    const analytics = sales.reduce<Record<string, { hub: string; category: string; total: number }>>((acc, sale) => {
      const shopName = sale.shop.name;
      sale.items.forEach((item) => {
        const category = item.product.category || "General";
        const key = `${shopName}-${category}`;
        if (!acc[key]) {
          acc[key] = { hub: shopName, category, total: 0 };
        }
        acc[key].total += item.price * item.quantity;
      });
      return acc;
    }, {});

    return ok({
      items: Object.values(analytics),
      totalRevenue: sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
    });
  }
);

export async function GET(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/analytics/sales-mix", requestId, () => protectedGet(req));
}