import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const alerts = [];

    // 1. DETECT "GHOST" WORKERS (Logged in but no sales in 4 hours)
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

    const ghosts = await prisma.user.findMany({
      where: {
        role: "WORKER", // FIXED: Was 'SALES_REP'
        attendance: {
          some: {
            // FIXED: 'checkOut' instead of 'clockOutTime'
            checkOut: null, 
            checkIn: { lte: fourHoursAgo }
          }
        },
        sales: {
          none: {
            createdAt: { gte: fourHoursAgo }
          }
        }
      },
      select: {
        id: true,
        name: true,
        shop: { select: { name: true } }
      },
      take: 5
    });

    // Format Ghost Alerts
    ghosts.forEach(ghost => {
      alerts.push({
        id: `ghost-${ghost.id}`,
        type: "GHOST_ALERT",
        user: ghost.name,
        shop: ghost.shop?.name || "Unknown Branch",
        message: "No activity recorded in 4+ hours",
        severity: "HIGH",
        timestamp: new Date()
      });
    });

    // 2. DETECT LOW STOCK (Using your schema's 'stockLevel' and 'minStock')
    const lowStock = await prisma.product.findMany({
      where: {
        // We use a raw comparison because Prisma fields can be tricky
        stockLevel: { lte: 5 } // Hardcoded threshold for safety
      },
      include: { shop: true },
      take: 3
    });

    lowStock.forEach(item => {
      alerts.push({
        id: `stock-${item.id}`,
        type: "STOCK_LOW",
        user: "System",
        shop: item.shop.name,
        message: `${item.name} is running low (${item.stockLevel} left)`,
        severity: "MEDIUM",
        timestamp: new Date()
      });
    });

    // 3. DETECT HIGH VALUE SALES (Live Ticker)
    const bigSales = await prisma.sale.findMany({
      where: {
        totalAmount: { gte: 1000 } // Sales over 1000 GHS
      },
      include: { 
        user: true,
        shop: true 
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    });

    bigSales.forEach(sale => {
      alerts.push({
        id: `sale-${sale.id}`,
        type: "BIG_SALE",
        user: sale.user.name,
        shop: sale.shop.name,
        message: `Closed a ₵${sale.totalAmount} deal`,
        severity: "POSITIVE",
        timestamp: sale.createdAt
      });
    });

    return NextResponse.json(alerts);

  } catch (error) {
    console.error("❌ PULSE_FEED_ERROR:", error);
    // Return empty array instead of crashing
    return NextResponse.json([]);
  }
}