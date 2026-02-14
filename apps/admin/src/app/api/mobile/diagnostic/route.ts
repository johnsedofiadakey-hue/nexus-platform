import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { ok } from "@/lib/platform/api-response";

export const dynamic = "force-dynamic";

/**
 * 🔧 MOBILE POS DIAGNOSTIC ENDPOINT
 * Use this to verify mobile POS configuration and detect issues
 * URL: /api/mobile/diagnostic
 */

export async function GET(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  return withApiErrorHandling(req, "/api/mobile/diagnostic", requestId, async () => {
    const protectedGet = withTenantProtection(
      {
        route: "/api/mobile/diagnostic",
        roles: ["WORKER", "ASSISTANT", "AGENT", "MANAGER", "ADMIN", "SUPER_ADMIN"],
        rateLimit: { keyPrefix: "mobile-diagnostic-read", max: 60, windowMs: 60_000 },
      },
      async (_request, ctx) => {
        const diagnostics: any = {
          timestamp: new Date().toISOString(),
          status: "checking",
          checks: {},
        };

        diagnostics.checks.session = {
          status: "✅ PASS",
          hasSession: true,
          userId: ctx.sessionUser.id,
          userName: ctx.sessionUser.email,
          userRole: ctx.sessionUser.role,
          isMobileRole: ["WORKER", "AGENT", "ASSISTANT"].includes(ctx.sessionUser.role),
        };

        const user = await ctx.scopedPrisma.user.findUnique({
          where: { id: ctx.sessionUser.id },
          include: {
            shop: {
              select: {
                id: true,
                name: true,
                latitude: true,
                longitude: true,
                status: true,
              },
            },
          },
        });

        diagnostics.checks.userProfile = {
          status: user ? "✅ PASS" : "❌ FAIL",
          exists: !!user,
          hasShop: !!user?.shopId,
          shopId: user?.shopId || null,
          shopName: user?.shop?.name || null,
          shopActive: user?.shop?.status === "ACTIVE",
        };

        if (user?.shopId) {
          const shop = await ctx.scopedPrisma.shop.findUnique({
            where: { id: user.shopId },
            include: {
              _count: {
                select: {
                  products: true,
                  users: true,
                },
              },
            },
          });

          diagnostics.checks.shopConfig = {
            status: shop ? "✅ PASS" : "❌ FAIL",
            shopExists: !!shop,
            hasGPS: !!(shop?.latitude && shop?.longitude),
            gpsCoords: shop ? { lat: shop.latitude, lng: shop.longitude } : null,
            productCount: shop?._count.products || 0,
            teamCount: shop?._count.users || 0,
            hasInventory: (shop?._count.products || 0) > 0,
          };

          const inventory = await ctx.scopedPrisma.product.findMany({
            where: { shopId: user.shopId },
            take: 5,
            select: {
              id: true,
              name: true,
              stockLevel: true,
              sellingPrice: true,
            },
          });

          diagnostics.checks.inventory = {
            status: inventory.length > 0 ? "✅ PASS" : "⚠️ WARN",
            itemCount: inventory.length,
            sampleItems: inventory.map((product) => ({
              name: product.name,
              stock: product.stockLevel,
              price: product.sellingPrice,
            })),
          };

          const recentSales = await ctx.scopedPrisma.sale.findMany({
            where: { shopId: user.shopId },
            take: 5,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              totalAmount: true,
              createdAt: true,
              status: true,
            },
          });

          diagnostics.checks.salesHistory = {
            status: "✅ PASS",
            recentSalesCount: recentSales.length,
            lastSale: recentSales[0]
              ? {
                  id: recentSales[0].id,
                  amount: recentSales[0].totalAmount,
                  time: recentSales[0].createdAt,
                }
              : null,
          };
        } else {
          diagnostics.checks.shopConfig = {
            status: "⚠️ SKIP",
            message: "User not assigned to shop",
          };
        }

        diagnostics.checks.environment = {
          status: "✅ PASS",
          hasDatabase: !!process.env.DATABASE_URL,
          hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
          hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
          nodeEnv: process.env.NODE_ENV || "unknown",
          platform: process.platform || "unknown",
        };

        const allChecks = Object.values(diagnostics.checks);
        const failCount = allChecks.filter((check: any) => check.status?.includes("❌")).length;
        const warnCount = allChecks.filter((check: any) => check.status?.includes("⚠️")).length;

        if (failCount > 0) {
          diagnostics.status = "error";
          diagnostics.message = `${failCount} critical check(s) failed`;
        } else if (warnCount > 0) {
          diagnostics.status = "warning";
          diagnostics.message = `${warnCount} warning(s) detected`;
        } else {
          diagnostics.status = "success";
          diagnostics.message = "All checks passed ✅";
        }

        return ok(diagnostics);
      }
    );

    return protectedGet(req);
  });
}
