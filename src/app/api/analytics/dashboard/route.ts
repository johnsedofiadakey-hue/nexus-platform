import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
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
    // We do this manually as Prisma doesn't support computed sums directly easily
    const allProducts = await prisma.product.findMany({
      select: { buyingPrice: true, stockLevel: true }
    });
    
    const inventoryValue = allProducts.reduce((acc, item) => {
      return acc + (item.buyingPrice * item.stockLevel);
    }, 0);

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

    return NextResponse.json({
      revenue: revenueAgg._sum.totalAmount || 0,
      activeStaff: activeStaffCount,
      inventoryValue,
      chartData: chartData.length > 0 ? chartData : [{name: 'Today', sales: 0}],
      shopPerformance: formattedShopPerf
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