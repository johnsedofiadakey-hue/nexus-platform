import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 🚀 High-Speed Aggregation
    const [userCount, shopCount, totalSales] = await Promise.all([
      prisma.user.count({ where: { role: 'SALES_REP' } }),
      prisma.shop.count(),
      prisma.sale.aggregate({ _sum: { totalAmount: true } })
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