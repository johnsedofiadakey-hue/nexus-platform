import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Calculate Today's Revenue & Sales Count
    const salesToday = await prisma.sale.aggregate({
      where: { createdAt: { gte: today } },
      _sum: { totalAmount: true },
      _count: { id: true }
    });

    // 2. Count Active Staff (Clocked In but not Out)
    const activeStaff = await prisma.attendance.count({
      where: { 
        date: { gte: today },
        clockInTime: { not: null },
        clockOutTime: null
      }
    });

    // 3. Get Low Stock Alerts
    const lowStockItems = await prisma.product.count({
      where: { quantity: { lte: 5 } } // Hardcoded threshold or use minStock column
    });

    // 4. Get Recent Transactions (Live Feed)
    const recentSales = await prisma.sale.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        shop: { select: { name: true } },
      }
    });

    // 5. Get Top Performing Shops (Revenue)
    // Grouping by Shop for leaderboard
    const salesByShop = await prisma.sale.groupBy({
      by: ['shopId'],
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 4
    });

    // Fetch Shop Names for the leaderboard
    const leaderboard = await Promise.all(salesByShop.map(async (entry) => {
      const shop = await prisma.shop.findUnique({ where: { id: entry.shopId } });
      return {
        name: shop?.name || "Unknown Shop",
        revenue: entry._sum.totalAmount || 0
      };
    }));

    return NextResponse.json({
      revenue: salesToday._sum.totalAmount || 0,
      salesCount: salesToday._count.id || 0,
      activeStaff,
      lowStockCount: lowStockItems,
      recentSales,
      leaderboard
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}