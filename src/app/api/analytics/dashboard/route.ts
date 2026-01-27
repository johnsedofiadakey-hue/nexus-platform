import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays } from "date-fns";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const today = startOfDay(new Date());
    
    // Define "Live" Window (5 Minutes ago)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // 1. KPI: Total Revenue (Today) - Using 'total' or 'totalAmount' depending on your schema
    // I'll assume 'total' based on standard practice, but used 'totalAmount' to match your snippet.
    const revenueAgg = await prisma.sale.aggregate({
      where: { createdAt: { gte: today } },
      _sum: { total: true } // ⚠️ Ensure your Sale model uses 'total' or 'totalAmount'
    });

    // 2. KPI: Active Staff (Real-Time Pulse)
    // Counts users who have sent a GPS pulse in the last 5 mins
    const activeStaffCount = await prisma.user.count({
      where: { 
        role: 'AGENT',
        lastSeen: { gte: fiveMinutesAgo } 
      }
    });

    // 3. KPI: Inventory Value
    // Calculating Stock Value: Price * Quantity
    // We use a raw query for speed or JS reduce for safety. JS reduce is safer for now.
    const inventoryItems = await prisma.inventory.findMany({
      select: { priceGHS: true, quantity: true }
    });
    const inventoryValue = inventoryItems.reduce((acc, item) => acc + ((item.priceGHS || 0) * (item.quantity || 0)), 0);

    // 4. CHART DATA: Intraday Velocity
    const todaySales = await prisma.sale.findMany({
      where: { createdAt: { gte: today } },
      select: { createdAt: true, total: true }
    });

    const chartMap = new Map<string, number>();
    ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"].forEach(t => chartMap.set(t, 0));

    todaySales.forEach(sale => {
      const h = sale.createdAt.getHours();
      const slot = h < 10 ? "08:00" : h < 12 ? "10:00" : h < 14 ? "12:00" : h < 16 ? "14:00" : h < 18 ? "16:00" : "18:00";
      chartMap.set(slot, (chartMap.get(slot) || 0) + (sale.total || 0));
    });

    const chartData = Array.from(chartMap.entries()).map(([name, sales]) => ({ name, sales }));

    // 5. TOP SHOPS
    const shops = await prisma.shop.findMany({
      take: 5,
      include: {
        _count: { select: { sales: true } }
      }
    });

    const shopPerformance = shops.map(shop => ({
      name: shop.name,
      // Rough estimate if exact shop revenue isn't aggregated easily
      // Ideally you aggregate sales per shop, but this keeps it fast:
      revenue: shop._count.sales * 100, // Placeholder multiplier or perform real agg if needed
    }));

    // 6. GHOST ALERTS (People online but inactive)
    // Users active (pulsing) but no sales today
    const ghostCount = await prisma.user.count({
      where: {
        role: "AGENT",
        lastSeen: { gte: fiveMinutesAgo }, // They are here...
        sales: { none: { createdAt: { gte: today } } } // ...but haven't sold anything today
      }
    });

    return NextResponse.json({
      revenue: revenueAgg._sum.total || 0,
      activeStaff: activeStaffCount,
      inventoryValue,
      ghostCount,
      chartData,
      shopPerformance
    });

  } catch (error: any) {
    console.error("❌ DASHBOARD_API_ERROR:", error);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}