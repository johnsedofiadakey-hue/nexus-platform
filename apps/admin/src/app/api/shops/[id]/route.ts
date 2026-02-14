import { z } from "zod";
import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { fail, ok } from "@/lib/platform/api-response";
import { parseJsonBody } from "@/lib/platform/validation";
import { logActivity } from "@/lib/activity-logger";

export const dynamic = "force-dynamic";

const updateShopSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    location: z.string().max(250).optional(),
    managerName: z.string().max(120).optional(),
    managerContact: z.string().max(120).optional(),
    radius: z.coerce.number().positive().optional(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
  })
  .strip();

const inventoryMutationSchema = z
  .object({
    id: z.string().optional(),
    reason: z.string().optional(),
    priceGHS: z.coerce.number().optional(),
    price: z.coerce.number().optional(),
    quantity: z.coerce.number().int().min(0).optional(),
    stockLevel: z.coerce.number().int().min(0).optional(),
    minStock: z.coerce.number().int().min(0).optional(),
    productName: z.string().optional(),
    name: z.string().optional(),
    subCategory: z.string().optional(),
    modelNumber: z.string().optional(),
    description: z.string().optional(),
    notes: z.string().optional(),
    sku: z.string().optional(),
    category: z.string().optional(),
  })
  .strip();

const deleteInventorySchema = z
  .object({
    type: z.literal("INVENTORY"),
    id: z.string().min(1),
  })
  .strip();

function makeBarcode(sku: string | undefined): string {
  if (sku && sku.length > 2) return sku;
  return `SKU-${Date.now().toString().slice(-6)}`;
}

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  return withApiErrorHandling(req, "/api/shops/[id]", requestId, async () => {
    const { id } = await props.params;

    const protectedGet = withTenantProtection(
      {
        route: "/api/shops/[id]",
        roles: ["MANAGER", "ADMIN", "SUPER_ADMIN", "AUDITOR"],
        rateLimit: { keyPrefix: "shop-detail-read", max: 120, windowMs: 60_000 },
      },
      async (_request, ctx) => {
        const shop = await ctx.scopedPrisma.shop.findUnique({
          where: { id },
          include: {
            users: { select: { id: true, name: true, role: true } },
            products: { orderBy: { updatedAt: "desc" } },
          },
        });

        if (!shop) {
          return fail("SHOP_NOT_FOUND", "Shop not found", 404);
        }

        return ok({ ...shop, staff: shop.users, inventory: shop.products });
      }
    );

    return protectedGet(req);
  });
}

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  return withApiErrorHandling(req, "/api/shops/[id]", requestId, async () => {
    const { id } = await props.params;

    const protectedPatch = withTenantProtection(
      {
        route: "/api/shops/[id]",
        roles: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
        rateLimit: { keyPrefix: "shop-detail-write", max: 40, windowMs: 60_000 },
      },
      async (_request, ctx) => {
        const body = await parseJsonBody(req, updateShopSchema);

        const shop = await ctx.scopedPrisma.shop.update({
          where: { id },
          data: {
            name: body.name,
            location: body.location,
            managerName: body.managerName,
            managerContact: body.managerContact,
            radius: body.radius,
            latitude: body.latitude,
            longitude: body.longitude,
          },
        });

        await logActivity({
          userId: ctx.sessionUser.id,
          userName: ctx.sessionUser.email,
          userRole: ctx.sessionUser.role,
          action: "SHOP_UPDATED",
          entity: "Shop",
          entityId: id,
          description: `Updated shop details for "${body.name || shop.name}"`,
          metadata: { shopId: id, changes: body },
          ipAddress: ctx.ip,
          shopId: id,
          shopName: body.name || shop.name,
        });

        return ok(shop);
      }
    );

    return protectedPatch(req);
  });
}

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  return withApiErrorHandling(req, "/api/shops/[id]", requestId, async () => {
    const { id } = await props.params;

    const protectedPost = withTenantProtection(
      {
        route: "/api/shops/[id]",
        roles: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
        rateLimit: { keyPrefix: "shop-inventory-write", max: 50, windowMs: 60_000 },
      },
      async (_request, ctx) => {
        const shopOwner = await ctx.scopedPrisma.shop.findUnique({ where: { id }, select: { id: true, name: true } });
        if (!shopOwner) {
          return fail("SHOP_NOT_FOUND", "Shop not found or access denied", 403);
        }

        const body = await parseJsonBody(req, inventoryMutationSchema);
        const reason = body.reason || "MANUAL_UPDATE";
        const price = Number(body.priceGHS ?? body.price ?? 0);
        const quantity = Number(body.quantity ?? body.stockLevel ?? 0);
        const minStock = Number(body.minStock ?? 5);
        const productName = body.productName || body.name;
        const subCategory = body.subCategory || "Unsorted";
        const modelNumber = body.modelNumber || "";
        const description = body.description || body.notes || "";

        if (!productName || Number.isNaN(price)) {
          return fail("VALIDATION_ERROR", "Invalid price or name", 400);
        }

        if (body.id) {
          const updatedItem = await ctx.scopedPrisma.product.update({
            where: { id: body.id },
            data: {
              name: productName,
              modelNumber,
              description,
              barcode: body.sku,
              sellingPrice: price,
              stockLevel: quantity,
              minStock,
              category: body.category || "General",
              subCategory,
            },
          });

          await ctx.scopedPrisma.auditLog.create({
            data: {
              userId: ctx.sessionUser.id,
              action: "UPDATE_STOCK",
              entity: "Product",
              entityId: updatedItem.id,
              details: JSON.stringify({ reason, newStock: quantity, price }),
            },
          });

          return ok({
            item: updatedItem,
            message: "Inventory Updated",
            audit: { date: updatedItem.updatedAt, newTotal: updatedItem.stockLevel },
          });
        }

        const finalBarcode = makeBarcode(body.sku);
        const existing = await ctx.scopedPrisma.product.findFirst({ where: { barcode: finalBarcode, shopId: id } });
        if (existing) {
          return fail("CONFLICT", `Barcode ${finalBarcode} already exists`, 409);
        }

        const newItem = await ctx.scopedPrisma.product.create({
          data: {
            shopId: id,
            name: productName,
            modelNumber,
            description,
            barcode: finalBarcode,
            sellingPrice: price,
            buyingPrice: 0,
            stockLevel: quantity,
            minStock,
            category: body.category || "General",
            subCategory,
          },
        });

        await ctx.scopedPrisma.auditLog.create({
          data: {
            userId: ctx.sessionUser.id,
            action: "CREATE_STOCK",
            entity: "Product",
            entityId: newItem.id,
            details: JSON.stringify({ reason: "INITIAL_STOCK", qty: quantity, price }),
          },
        });

        return ok({
          item: newItem,
          message: "Item Added",
          audit: { date: newItem.createdAt, qtyAdded: newItem.stockLevel },
        }, 201);
      }
    );

    return protectedPost(req);
  });
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  return withApiErrorHandling(req, "/api/shops/[id]", requestId, async () => {
    const { id } = await props.params;

    const protectedDelete = withTenantProtection(
      {
        route: "/api/shops/[id]",
        roles: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
        rateLimit: { keyPrefix: "shop-delete-write", max: 20, windowMs: 60_000 },
      },
      async (_request, ctx) => {
        const shopOwner = await ctx.scopedPrisma.shop.findUnique({ where: { id }, select: { id: true, name: true } });
        if (!shopOwner) {
          return fail("FORBIDDEN", "Access denied", 403);
        }

        let parsedBody: unknown = null;
        try {
          const text = await req.text();
          parsedBody = text ? JSON.parse(text) : null;
        } catch {
          parsedBody = null;
        }

        const inventoryDelete = deleteInventorySchema.safeParse(parsedBody);
        if (inventoryDelete.success) {
          const product = await ctx.scopedPrisma.product.findFirst({ where: { id: inventoryDelete.data.id, shopId: id } });
          if (!product) {
            return fail("NOT_FOUND", "Item not found in this shop", 404);
          }

          await ctx.scopedPrisma.product.delete({ where: { id: inventoryDelete.data.id } });

          await logActivity({
            userId: ctx.sessionUser.id,
            userName: ctx.sessionUser.email,
            userRole: ctx.sessionUser.role,
            action: "PRODUCT_DELETED",
            entity: "Product",
            entityId: inventoryDelete.data.id,
            description: `Deleted product "${product.name}" from inventory`,
            metadata: { productId: inventoryDelete.data.id, productName: product.name },
            ipAddress: ctx.ip,
            shopId: id,
            shopName: shopOwner.name,
          });

          return ok({ message: "Item deleted" });
        }

        await ctx.scopedPrisma.$transaction([
          ctx.scopedPrisma.sale.deleteMany({ where: { shopId: id } }),
          ctx.scopedPrisma.expense.deleteMany({ where: { shopId: id } }),
          ctx.scopedPrisma.customer.deleteMany({ where: { shopId: id } }),
          ctx.scopedPrisma.product.deleteMany({ where: { shopId: id } }),
          ctx.scopedPrisma.user.updateMany({ where: { shopId: id }, data: { shopId: null } }),
          ctx.scopedPrisma.shop.delete({ where: { id } }),
        ]);

        await logActivity({
          userId: ctx.sessionUser.id,
          userName: ctx.sessionUser.email,
          userRole: ctx.sessionUser.role,
          action: "SHOP_DELETED",
          entity: "Shop",
          entityId: id,
          description: `Deleted shop "${shopOwner.name}" and all associated data`,
          metadata: { shopId: id, shopName: shopOwner.name },
          ipAddress: ctx.ip,
          shopId: id,
          shopName: shopOwner.name,
        });

        return ok({ message: "Shop and all related data purged." });
      }
    );

    return protectedDelete(req);
  });
}