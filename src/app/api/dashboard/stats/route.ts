import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Run Aggregations in Parallel for Speed
    const [
      salesToday,
      activeStaff,
      lowStockItems,
      totalRevenue
    ] = await Promise.all([
      // Count sales made today
      prisma.sale.count({
        where: { createdAt: { gte: today } }
      }),
      // Count staff active (e.g., clocked in today)
      prisma.attendance.count({
        where: { 
          date: { gte: today },
          clockOutTime: null // Still clocked in
        }
      }),
      // Count items below minStock
      prisma.product.count({
        where: { quantity: { lte: 5 } } // You can adjust '5' to use db field 'minStock' if preferred
      }),
      // Sum total revenue (All time)
      prisma.sale.aggregate({
        _sum: { totalAmount: true }
      })
    ]);

    // 2. Fetch Leaderboard (Top 3 Shops)
    const topShops = await prisma.shop.findMany({
      take: 3,
      include: {
        _count: { select: { sales: true } }
      },
      orderBy: { sales: { _count: 'desc' } }
    });

    return NextResponse.json({
      revenue: totalRevenue._sum.totalAmount || 0,
      salesCount: salesToday,
      activeStaff: activeStaff,
      lowStockCount: lowStockItems,
      leaderboard: topShops.map(s => ({ name: s.name, sales: s._count.sales }))
    });

  } catch (error) {
    console.error("Stats Error:", error);
    return NextResponse.json({ error: "Stats failed" }, { status: 500 });
  }
}