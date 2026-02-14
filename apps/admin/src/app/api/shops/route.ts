import { z } from "zod";
import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { fail, ok } from "@/lib/platform/api-response";
import { parseJsonBody } from "@/lib/platform/validation";
import { logActivity } from "@/lib/activity-logger";

export const dynamic = "force-dynamic";

const createShopSchema = z
  .object({
    name: z.string().min(1).max(120),
    location: z.string().max(250).optional(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
    radius: z.coerce.number().positive().optional(),
    managerName: z.string().max(120).optional(),
    managerContact: z.string().max(120).optional(),
  })
  .strip();

const protectedGet = withTenantProtection(
  {
    route: "/api/shops",
    roles: ["MANAGER", "ADMIN", "SUPER_ADMIN", "AUDITOR"],
    rateLimit: { keyPrefix: "shops-read", max: 120, windowMs: 60_000 },
  },
  async (_req, ctx) => {
    const shops = await ctx.scopedPrisma.shop.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true } },
      },
    });

    return ok(shops);
  }
);

const protectedPost = withTenantProtection(
  {
    route: "/api/shops",
    roles: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
    rateLimit: { keyPrefix: "shops-write", max: 30, windowMs: 60_000 },
  },
  async (req, ctx) => {
    if (!ctx.orgId) {
      return fail("ORGANIZATION_REQUIRED", "Organization is required", 400);
    }

    const body = await parseJsonBody(req, createShopSchema);
    const shop = await ctx.scopedPrisma.shop.create({
      data: {
        name: body.name,
        location: body.location || "Unknown Location",
        latitude: body.latitude ?? 0,
        longitude: body.longitude ?? 0,
        radius: body.radius ?? 150,
        managerName: body.managerName,
        managerContact: body.managerContact,
        organization: { connect: { id: ctx.orgId } },
      },
      select: {
        id: true,
        name: true,
        location: true,
        latitude: true,
        longitude: true,
        radius: true,
        managerName: true,
        managerContact: true,
      },
    });

    await logActivity({
      userId: ctx.sessionUser.id,
      userName: ctx.sessionUser.email,
      userRole: ctx.sessionUser.role,
      action: "SHOP_CREATED",
      entity: "Shop",
      entityId: shop.id,
      description: `Created shop "${shop.name}" at ${shop.location}`,
      metadata: { shopId: shop.id, name: shop.name, location: shop.location },
      ipAddress: ctx.ip,
      shopId: shop.id,
      shopName: shop.name,
    });

    return ok(shop, 201);
  }
);

export async function GET(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/shops", requestId, () => protectedGet(req));
}

export async function POST(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/shops", requestId, () => protectedPost(req));
}