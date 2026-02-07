import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 🔧 MOBILE POS DIAGNOSTIC ENDPOINT
 * Use this to verify mobile POS configuration and detect issues
 * URL: /api/mobile/diagnostic
 */

export async function GET(req: Request) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    status: "checking",
    checks: {}
  };

  try {
    // 1. Session Check
    const session = await getServerSession(authOptions);
    diagnostics.checks.session = {
      status: session ? "✅ PASS" : "❌ FAIL",
      hasSession: !!session,
      userId: session?.user?.id || null,
      userName: session?.user?.name || null,
      userRole: (session?.user as any)?.role || null,
      isMobileRole: session ? ['WORKER', 'AGENT', 'ASSISTANT'].includes((session.user as any).role) : false
    };

    if (!session) {
      diagnostics.status = "error";
      diagnostics.message = "Not authenticated";
      return NextResponse.json(diagnostics, { status: 401 });
    }

    // 2. User Profile Check
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
            status: true
          }
        }
      }
    });

    diagnostics.checks.userProfile = {
      status: user ? "✅ PASS" : "❌ FAIL",
      exists: !!user,
      hasShop: !!user?.shopId,
      shopId: user?.shopId || null,
      shopName: user?.shop?.name || null,
      shopActive: user?.shop?.status === 'ACTIVE'
    };

    // 3. Shop Configuration Check
    if (user?.shopId) {
      const shop = await prisma.shop.findUnique({
        where: { id: user.shopId },
        include: {
          _count: {
            select: {
              products: true,
              users: true
            }
          }
        }
      });

      diagnostics.checks.shopConfig = {
        status: shop ? "✅ PASS" : "❌ FAIL",
        shopExists: !!shop,
        hasGPS: !!(shop?.latitude && shop?.longitude),
        gpsCoords: shop ? { lat: shop.latitude, lng: shop.longitude } : null,
        productCount: shop?._count.products || 0,
        teamCount: shop?._count.users || 0,
        hasInventory: (shop?._count.products || 0) > 0
      };
    } else {
      diagnostics.checks.shopConfig = {
        status: "⚠️ SKIP",
        message: "User not assigned to shop"
      };
    }

    // 4. Inventory Check
    if (user?.shopId) {
      const inventory = await prisma.product.findMany({
        where: { shopId: user.shopId },
        take: 5,
        select: {
          id: true,
          name: true,
          stockLevel: true,
          sellingPrice: true
        }
      });

      diagnostics.checks.inventory = {
        status: inventory.length > 0 ? "✅ PASS" : "⚠️ WARN",
        itemCount: inventory.length,
        sampleItems: inventory.map(p => ({
          name: p.name,
          stock: p.stockLevel,
          price: p.sellingPrice
        }))
      };
    }

    // 5. Recent Sales Check
    if (user?.shopId) {
      const recentSales = await prisma.sale.findMany({
        where: { shopId: user.shopId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          totalAmount: true,
          createdAt: true,
          status: true
        }
      });

      diagnostics.checks.salesHistory = {
        status: "✅ PASS",
        recentSalesCount: recentSales.length,
        lastSale: recentSales[0] ? {
          id: recentSales[0].id,
          amount: recentSales[0].totalAmount,
          time: recentSales[0].createdAt
        } : null
      };
    }

    // 6. Environment Check
    diagnostics.checks.environment = {
      status: "✅ PASS",
      hasDatabase: !!process.env.DATABASE_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      nodeEnv: process.env.NODE_ENV || 'unknown',
      platform: process.platform || 'unknown'
    };

    // 7. Overall Status
    const allChecks = Object.values(diagnostics.checks);
    const failCount = allChecks.filter((c: any) => c.status?.includes('❌')).length;
    const warnCount = allChecks.filter((c: any) => c.status?.includes('⚠️')).length;

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

    return NextResponse.json(diagnostics, { status: 200 });

  } catch (error: any) {
    console.error("Diagnostic error:", error);
    diagnostics.status = "error";
    diagnostics.message = error.message;
    return NextResponse.json(diagnostics, { status: 500 });
  }
}
