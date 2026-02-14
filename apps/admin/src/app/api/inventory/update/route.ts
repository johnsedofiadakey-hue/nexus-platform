import { z } from "zod";
import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { fail, ok } from "@/lib/platform/api-response";
import { parseJsonBody } from "@/lib/platform/validation";
import { logActivity } from "@/lib/activity-logger";

export const dynamic = "force-dynamic";

const updateInventorySchema = z
  .object({
    sku: z.string().min(1),
    quantity: z.number().int().positive(),
    shopId: z.string().min(1),
    action: z.enum(["ADD", "SELL"]),
  })
  .strip();

const protectedPost = withTenantProtection(
  {
    route: "/api/inventory/update",
    roles: ["WORKER", "AGENT", "ASSISTANT", "MANAGER", "ADMIN", "SUPER_ADMIN"],
    rateLimit: { keyPrefix: "inventory-update-write", max: 45, windowMs: 60_000 },
  },
  async (req, ctx) => {
    const body = await parseJsonBody(req, updateInventorySchema);

    const result = await ctx.scopedPrisma.$transaction(async (tx: any) => {
      const product = await tx.product.findFirst({
        where: { barcode: body.sku, shopId: body.shopId },
      });

      if (!product && body.action !== "ADD") {
        return null;
      }

      if (product && body.action === "SELL" && product.stockLevel < body.quantity) {
        throw new Error(`Insufficient stock. Only ${product.stockLevel} remaining`);
      }

      if (product) {
        return tx.product.update({
          where: { id: product.id },
          data: {
            stockLevel:
              body.action === "ADD"
                ? { increment: body.quantity }
                : { decrement: body.quantity },
          },
        });
      }

      return tx.product.create({
        data: {
          barcode: body.sku,
          shopId: body.shopId,
          stockLevel: body.quantity,
          name: "New Unlisted Item",
          sellingPrice: 0,
          category: "Uncategorized",
        },
      });
    });

    if (!result) {
      return fail("PRODUCT_NOT_FOUND", "Product not found in this shop", 404);
    }

    await logActivity({
      userId: ctx.sessionUser.id,
      userName: ctx.sessionUser.email,
      userRole: ctx.sessionUser.role,
      action: body.action === "ADD" ? "INVENTORY_ADDED" : "INVENTORY_SOLD",
      entity: "Product",
      entityId: result.id,
      description: `${body.action === "ADD" ? "Added" : "Sold"} ${body.quantity} units of ${result.name} (SKU: ${body.sku})`,
      metadata: { productId: result.id, sku: body.sku, quantity: body.quantity, action: body.action },
      ipAddress: ctx.ip,
      shopId: body.shopId,
    });

    return ok(result);
  }
);

export async function POST(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/inventory/update", requestId, () => protectedPost(req));
}
