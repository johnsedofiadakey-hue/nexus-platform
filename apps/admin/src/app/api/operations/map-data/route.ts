import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { ok } from "@/lib/platform/api-response";

export const dynamic = "force-dynamic";

const protectedGet = withTenantProtection(
  {
    route: "/api/operations/map-data",
    roles: ["MANAGER", "ADMIN", "SUPER_ADMIN", "AUDITOR"],
    rateLimit: { keyPrefix: "operations-map-data-read", max: 120, windowMs: 60_000 },
  },
  async (_req, ctx) => {
    const data = await ctx.scopedPrisma.shop.findMany({
      include: {
        sales: { select: { totalAmount: true } },
        _count: { select: { users: true } },
      },
    });

    const formatted = data.map((node) => ({
      id: node.id,
      name: node.name,
      lat: node.latitude,
      lng: node.longitude,
      sales: node.sales.reduce((acc, sale) => acc + sale.totalAmount, 0),
      staffCount: node._count.users || 0,
    }));

    return ok(formatted);
  }
);

export async function GET(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/operations/map-data", requestId, () => protectedGet(req));
}