import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { ok } from "@/lib/platform/api-response";

export const dynamic = "force-dynamic";

const protectedGet = withTenantProtection(
  {
    route: "/api/sales/history",
    roles: ["WORKER", "ASSISTANT", "AGENT", "MANAGER", "ADMIN", "SUPER_ADMIN"],
    rateLimit: { keyPrefix: "sales-history-read", max: 120, windowMs: 60_000 },
  },
  async (_req, ctx) => {
    const user = await ctx.scopedPrisma.user.findUnique({
      where: { id: ctx.sessionUser.id },
      select: { shopId: true },
    });

    if (!user?.shopId) {
      return ok([]);
    }

    const sales = await ctx.scopedPrisma.sale.findMany({
      where: { shopId: user.shopId },
      select: {
        id: true,
        totalAmount: true,
        paymentMethod: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return ok(sales);
  }
);

export async function GET(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/sales/history", requestId, () => protectedGet(req));
}