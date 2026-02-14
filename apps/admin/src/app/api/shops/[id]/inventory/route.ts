import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { ok, fail } from "@/lib/platform/api-response";

export const dynamic = 'force-dynamic';

// ----------------------------------------------------------------------
// 1. GET: FETCH SHOP INVENTORY (Scoped)
// ----------------------------------------------------------------------
const protectedGet = withTenantProtection(
  {
    route: "/api/shops/[id]/inventory",
    roles: ["WORKER", "AGENT", "ASSISTANT", "MANAGER", "ADMIN", "SUPER_ADMIN"],
    rateLimit: { keyPrefix: "shop-inv-read", max: 120, windowMs: 60_000 },
  },
  async (req, ctx) => {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const shopIdx = pathParts.indexOf("shops");
    const shopId = pathParts[shopIdx + 1];

    // Verify shop belongs to org via scoped prisma
    const shop = await ctx.scopedPrisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) return fail("NOT_FOUND", "Shop not found", 404);

    const products = await ctx.scopedPrisma.product.findMany({
      where: { shopId },
      orderBy: { updatedAt: "desc" },
    });

    return ok(products);
  }
);

// ----------------------------------------------------------------------
// 2. POST: CREATE ITEM OR RESTOCK (Scoped)
// ----------------------------------------------------------------------
const protectedPost = withTenantProtection(
  {
    route: "/api/shops/[id]/inventory",
    roles: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
    rateLimit: { keyPrefix: "shop-inv-write", max: 60, windowMs: 60_000 },
  },
  async (req, ctx) => {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const shopIdx = pathParts.indexOf("shops");
    const shopId = pathParts[shopIdx + 1];

    // Verify shop belongs to org
    const shop = await ctx.scopedPrisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) return fail("NOT_FOUND", "Shop not found", 404);

    const body = await req.json();

    // Option A: RESTOCK
    if (body.action === 'RESTOCK') {
      if (!body.productId || !body.amount) {
        return fail("VALIDATION", "Product ID and Amount required", 400);
      }
      const updated = await ctx.scopedPrisma.product.update({
        where: { id: body.productId },
        data: { stockLevel: { increment: parseInt(body.amount) } }
      });
      return ok(updated);
    }

    // Option B: CREATE NEW ITEM
    const name = body.productName || body.name;
    const price = parseFloat(body.priceGHS || body.price || body.sellingPrice || '0');
    const cost = parseFloat(body.buyingPrice || body.costPrice || '0');
    const qty = parseInt(body.quantity || body.stockLevel || '0');
    const minStock = parseInt(body.minStock || '5');

    if (!name || isNaN(price)) {
      return fail("VALIDATION", "Product Name and Selling Price are required", 400);
    }

    const barcode = body.sku?.trim() || body.barcode?.trim() || `SKU-${Date.now().toString().slice(-6)}`;

    const product = await ctx.scopedPrisma.product.create({
      data: {
        shopId,
        name,
        barcode,
        sellingPrice: price,
        buyingPrice: cost,
        stockLevel: qty,
        minStock,
        category: body.category || "GENERAL",
      },
    });

    return ok(product);
  }
);

// ----------------------------------------------------------------------
// 3. DELETE: REMOVE INVENTORY ITEM (Scoped)
// ----------------------------------------------------------------------
const protectedDelete = withTenantProtection(
  {
    route: "/api/shops/[id]/inventory",
    roles: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
    rateLimit: { keyPrefix: "shop-inv-del", max: 30, windowMs: 60_000 },
  },
  async (req, ctx) => {
    const body = await req.json();
    const { id } = body;
    if (!id) return fail("VALIDATION", "Product ID required", 400);

    await ctx.scopedPrisma.product.delete({ where: { id } });
    return ok({ deleted: true });
  }
);

export async function GET(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/shops/[id]/inventory", requestId, () => protectedGet(req));
}

export async function POST(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/shops/[id]/inventory", requestId, () => protectedPost(req));
}

export async function DELETE(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/shops/[id]/inventory", requestId, () => protectedDelete(req));
}