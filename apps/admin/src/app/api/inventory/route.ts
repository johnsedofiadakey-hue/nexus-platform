import { z } from "zod";
import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { ok } from "@/lib/platform/api-response";
import { parseQuery } from "@/lib/platform/validation";

export const dynamic = "force-dynamic";

const querySchema = z
  .object({
    shopId: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strip();

const protectedGet = withTenantProtection(
  {
    route: "/api/inventory",
    roles: ["WORKER", "AGENT", "ASSISTANT", "MANAGER", "ADMIN", "SUPER_ADMIN"],
    rateLimit: { keyPrefix: "inventory-read", max: 120, windowMs: 60_000 },
  },
  async (req, ctx) => {
    const query = parseQuery(new URL(req.url), querySchema);
    const skip = (query.page - 1) * query.limit;

    const whereClause = query.shopId ? { shopId: query.shopId } : {};

    const [total, products] = await Promise.all([
      ctx.scopedPrisma.product.count({ where: whereClause }),
      ctx.scopedPrisma.product.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          barcode: true,
          sellingPrice: true,
          stockLevel: true,
          category: true,
          minStock: true,
          shopId: true,
          shop: { select: { name: true } },
        },
        orderBy: { name: "asc" },
        take: query.limit,
        skip,
      }),
    ]);

    return ok({
      items: products.map((product) => ({
        id: product.id,
        productName: product.name,
        name: product.name,
        sku: product.barcode || product.id.substring(0, 6).toUpperCase(),
        barcode: product.barcode || product.id.substring(0, 6).toUpperCase(),
        priceGHS: product.sellingPrice,
        price: product.sellingPrice,
        sellingPrice: product.sellingPrice,
        stockLevel: product.stockLevel,
        quantity: product.stockLevel,
        stock: product.stockLevel,
        category: product.category || "General",
        minStock: product.minStock ?? 5,
        shopId: product.shopId,
        hub: product.shop?.name || "Unknown",
        status: product.stockLevel <= (product.minStock || 5) ? "Low Stock" : "In Stock",
      })),
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  }
);

export async function GET(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/inventory", requestId, () => protectedGet(req));
}