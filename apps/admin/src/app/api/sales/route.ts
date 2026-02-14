import { z } from "zod";
import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { ok, fail } from "@/lib/platform/api-response";
import { parseJsonBody, parseQuery } from "@/lib/platform/validation";
import { logActivity } from "@/lib/activity-logger";

export const dynamic = "force-dynamic";

const getQuerySchema = z
  .object({
    userId: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strip();

const postSchema = z
  .object({
    shopId: z.string().min(1),
    totalAmount: z.number().nonnegative(),
    source: z.string().optional().default("MOBILE"),
    items: z
      .array(
        z
          .object({
            productId: z.string().min(1),
            quantity: z.number().int().positive(),
            price: z.number().nonnegative(),
          })
          .strip()
      )
      .min(1),
  })
  .strip();

const protectedGet = withTenantProtection(
  {
    route: "/api/sales",
    roles: ["WORKER", "AGENT", "ASSISTANT", "MANAGER", "ADMIN", "SUPER_ADMIN"],
    rateLimit: { keyPrefix: "user-sales-read", max: 120, windowMs: 60_000 },
  },
  async (req, ctx) => {
    const url = new URL(req.url);
    const query = parseQuery(url, getQuerySchema);

    const targetUserId = query.userId || ctx.sessionUser.id;
    const privileged = ["MANAGER", "ADMIN", "SUPER_ADMIN"].includes(ctx.sessionUser.role);
    if (!privileged && targetUserId !== ctx.sessionUser.id) {
      return fail("FORBIDDEN", "Cannot view other user sales", 403);
    }

    const skip = (query.page - 1) * query.limit;

    const [total, sales] = await Promise.all([
      ctx.scopedPrisma.sale.count({ where: { userId: targetUserId } }),
      ctx.scopedPrisma.sale.findMany({
        where: { userId: targetUserId },
        take: query.limit,
        skip,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          totalAmount: true,
          amountPaid: true,
          paymentMethod: true,
          status: true,
          createdAt: true,
          shop: { select: { name: true } },
          items: {
            select: {
              id: true,
              quantity: true,
              price: true,
              product: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    return ok({
      items: sales,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  }
);

const protectedPost = withTenantProtection(
  {
    route: "/api/sales",
    roles: ["WORKER", "AGENT", "ASSISTANT", "MANAGER", "ADMIN", "SUPER_ADMIN"],
    rateLimit: { keyPrefix: "user-sales-write", max: 30, windowMs: 60_000 },
    requireShopId: true,
  },
  async (req, ctx) => {
    const body = await parseJsonBody(req, postSchema);

    const result = await ctx.scopedPrisma.$transaction(async (tx: any) => {
      for (const item of body.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }
        if (product.stockLevel < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }
      }

      for (const item of body.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockLevel: { decrement: item.quantity } },
        });
      }

      return tx.sale.create({
        data: {
          shopId: body.shopId,
          userId: ctx.sessionUser.id,
          totalAmount: body.totalAmount,
          paymentMethod: "CASH",
          status: "COMPLETED",
          items: {
            create: body.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      });
    });

    await logActivity({
      userId: ctx.sessionUser.id,
      userName: ctx.sessionUser.email,
      userRole: ctx.sessionUser.role,
      action: "SALE_CREATED",
      entity: "Sale",
      entityId: result.id,
      description: `Sale created: ${body.items.length} item(s), total ${body.totalAmount}`,
      metadata: { totalAmount: body.totalAmount, itemCount: body.items.length, source: body.source },
      ipAddress: ctx.ip,
      shopId: body.shopId,
    });

    return ok({ id: result.id }, 201);
  }
);

export async function GET(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/sales", requestId, () => protectedGet(req));
}

export async function POST(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/sales", requestId, () => protectedPost(req));
}
