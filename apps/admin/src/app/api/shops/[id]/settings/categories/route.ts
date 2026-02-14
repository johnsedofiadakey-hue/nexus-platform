import { z } from "zod";
import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { fail, ok } from "@/lib/platform/api-response";
import { parseJsonBody } from "@/lib/platform/validation";

export const dynamic = "force-dynamic";

const categorySchema = z
  .object({
    name: z.string().min(1),
    parentId: z.string().optional(),
  })
  .strip();

const deleteSchema = z
  .object({
    id: z.string().min(1),
    isSub: z.boolean().optional(),
  })
  .strip();

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  return withApiErrorHandling(req, "/api/shops/[id]/settings/categories", requestId, async () => {
    const { id } = await props.params;

    const protectedGet = withTenantProtection(
      {
        route: "/api/shops/[id]/settings/categories",
        roles: ["MANAGER", "ADMIN", "SUPER_ADMIN", "AUDITOR"],
        rateLimit: { keyPrefix: "shop-categories-read", max: 120, windowMs: 60_000 },
      },
      async (_request, ctx) => {
        const shop = await ctx.scopedPrisma.shop.findFirst({ where: { id } });
        if (!shop) {
          return ok([], 403);
        }

        const categories = await ctx.scopedPrisma.inventoryCategory.findMany({
          where: { shopId: id },
          include: { subCategories: true },
          orderBy: { name: "asc" },
        });
        return ok(categories);
      }
    );

    return protectedGet(req);
  });
}

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  return withApiErrorHandling(req, "/api/shops/[id]/settings/categories", requestId, async () => {
    const { id } = await props.params;

    const protectedPost = withTenantProtection(
      {
        route: "/api/shops/[id]/settings/categories",
        roles: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
        rateLimit: { keyPrefix: "shop-categories-write", max: 40, windowMs: 60_000 },
      },
      async (_request, ctx) => {
        const shop = await ctx.scopedPrisma.shop.findFirst({ where: { id } });
        if (!shop) {
          return fail("FORBIDDEN", "Access Denied", 403);
        }

        const body = await parseJsonBody(req, categorySchema);

        if (body.parentId) {
          const sub = await ctx.scopedPrisma.inventorySubCategory.create({
            data: { name: body.name, categoryId: body.parentId },
          });
          return ok(sub, 201);
        }

        const category = await ctx.scopedPrisma.inventoryCategory.create({
          data: { name: body.name, shopId: id },
        });
        return ok(category, 201);
      }
    );

    return protectedPost(req);
  });
}

export async function DELETE(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  return withApiErrorHandling(req, "/api/shops/[id]/settings/categories", requestId, async () => {
    const protectedDelete = withTenantProtection(
      {
        route: "/api/shops/[id]/settings/categories",
        roles: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
        rateLimit: { keyPrefix: "shop-categories-delete", max: 30, windowMs: 60_000 },
      },
      async (_request, ctx) => {
        const body = await parseJsonBody(req, deleteSchema);

        if (body.isSub) {
          const subCategory = await ctx.scopedPrisma.inventorySubCategory.findUnique({
            where: { id: body.id },
            include: { category: { include: { shop: true } } },
          });
          if (!subCategory) {
            return fail("FORBIDDEN", "Forbidden", 403);
          }
          await ctx.scopedPrisma.inventorySubCategory.delete({ where: { id: body.id } });
          return ok({ success: true });
        }

        const category = await ctx.scopedPrisma.inventoryCategory.findUnique({
          where: { id: body.id },
          include: { shop: true },
        });
        if (!category) {
          return fail("FORBIDDEN", "Forbidden", 403);
        }
        await ctx.scopedPrisma.inventoryCategory.delete({ where: { id: body.id } });
        return ok({ success: true });
      }
    );

    return protectedDelete(req);
  });
}