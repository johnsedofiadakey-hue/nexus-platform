import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for API routes that use database
export const dynamic = 'force-dynamic';
import { requireAuth, handleApiError } from "@/lib/auth-helpers";

export async function GET() {
  try {
    // 🔐 Require authentication
    const user = await requireAuth();

    // 🏢 Build organization filter
    const orgFilter = user.role === "SUPER_ADMIN" && !user.organizationId
      ? {} // Super admin sees all
      : { organizationId: user.organizationId };

    // 🚀 High-Speed Aggregation with tenant isolation
    const [userCount, shopCount, totalSales] = await Promise.all([
      prisma.user.count({ where: { ...orgFilter, role: 'SALES_REP' } }),
      prisma.shop.count({ where: orgFilter }),
      prisma.sale.aggregate({
        where: {
          shop: orgFilter
        },
        _sum: { totalAmount: true }
      })
    ]);

    return NextResponse.json({
      personnel: userCount,
      shops: shopCount,
      revenue: totalSales._sum.totalAmount || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ error: "Stats engine stalled" }, { status: 500 });
  }
}