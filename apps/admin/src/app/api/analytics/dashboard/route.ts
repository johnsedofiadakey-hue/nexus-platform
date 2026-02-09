import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for API routes that use database
export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. KPI: Total Revenue (Today)
    const revenueAgg = await prisma.sale.aggregate({
      where: { createdAt: { gte: today } },
      _sum: { totalAmount: true } // FIXED: Changed 'total' to 'totalAmount'
    });

    // 2. KPI: Active Staff
    const activeStaffCount = await prisma.attendance.count({
      where: {
        date: { gte: today },
        checkOut: null
      }
    });

    // 3. KPI: Inventory Value (Buying Price * Stock)
    // ⚡️ OPTIMIZED: Use Raw SQL for speed instead of loading all rows
    const inventoryValRaw: any[] = await prisma.$queryRaw`
      SELECT SUM("buyingPrice" * "quantity") as total_value FROM "Product"
    `;
    const inventoryValue = inventoryValRaw[0]?.total_value || 0;

    // 4. CHART DATA: Sales Velocity (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSales = await prisma.sale.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: sevenDaysAgo } },
      _sum: { totalAmount: true },
    });

    // Format chart data (Group by Day Name)
    const chartMap = new Map();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    recentSales.forEach(entry => {
      const dayName = days[new Date(entry.createdAt).getDay()];
      const current = chartMap.get(dayName) || 0;
      chartMap.set(dayName, current + (entry._sum.totalAmount || 0));
    });

    const chartData = Array.from(chartMap).map(([name, sales]) => ({ name, sales }));

    // 5. Shop Performance Leaderboard
    const shopPerformance = await prisma.shop.findMany({
      take: 5,
      include: {
        sales: {
          where: { createdAt: { gte: today } },
          select: { totalAmount: true }
        }
      }
    });

    const formattedShopPerf = shopPerformance.map(shop => ({
      name: shop.name,
      revenue: shop.sales.reduce((acc, sale) => acc + sale.totalAmount, 0)
    })).sort((a, b) => b.revenue - a.revenue);

    // 6. 🎯 ADMIN TARGET PERFORMANCE
    let adminTargetData = null;
    if (userId) {
      const activeTarget = await prisma.target.findFirst({
        where: { userId, status: 'ACTIVE', endDate: { gte: new Date() } },
        orderBy: { createdAt: 'desc' }
      });

      if (activeTarget) {
        // Aggregate Sales within Target Period
        const periodPerformance = await prisma.sale.aggregate({
          where: {
            createdAt: {
              gte: activeTarget.startDate,
              lte: activeTarget.endDate
            }
          },
          _sum: {
            totalAmount: true
          },
          _count: {
            id: true // Volume of transactions
          }
        });

        // Also get total items sold (volume) if needed, but transaction count is often a good proxy. 
        // If "Quantity" means individual items, we need to sum SaleItem.quantity.
        // Let's assume Target Quantity is 'Units Sold'.
        const itemsPerformance = await prisma.saleItem.aggregate({
          where: {
            sale: {
              createdAt: {
                gte: activeTarget.startDate,
                lte: activeTarget.endDate
              }
            }
          },
          _sum: {
            quantity: true
          }
        });

        adminTargetData = {
          ...activeTarget,
          currentRevenue: periodPerformance._sum.totalAmount || 0,
          currentVolume: itemsPerformance._sum.quantity || 0
        };
      }
    }

    return NextResponse.json({
      revenue: revenueAgg._sum.totalAmount || 0,
      activeStaff: activeStaffCount,
      inventoryValue,
      chartData: chartData.length > 0 ? chartData : [{ name: 'Today', sales: 0 }],
      shopPerformance: formattedShopPerf,
      adminTarget: adminTargetData
    });

  } catch (error) {
    console.error("❌ DASHBOARD_API_ERROR:", error);
    return NextResponse.json({
      revenue: 0,
      activeStaff: 0,
      inventoryValue: 0,
      chartData: [],
      shopPerformance: []
    });
  }
}