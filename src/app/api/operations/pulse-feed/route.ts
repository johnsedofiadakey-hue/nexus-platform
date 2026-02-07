import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-helpers";

export async function GET() {
  try {
    // 🔐 Require authentication
    const user = await requireAuth();

    // 🏢 Build organization filter
    const orgFilter = user.role === "SUPER_ADMIN" && !user.organizationId
      ? {} // Super admin sees all
      : { organizationId: user.organizationId };

    const alerts = [];

    // 1. DETECT "GHOST" WORKERS (Logged in but no sales in 4 hours)
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

    const ghosts = await prisma.user.findMany({
      where: {
        ...orgFilter,
        role: "WORKER",
        attendance: {
          some: {
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
        stockLevel: { lte: 5 },
        shop: orgFilter // Filter by organization
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
        shop: orgFilter // Filter by organization
      },
      include: {
        user: true,
        shop: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    bigSales.forEach(sale => {
      alerts.push({
        id: `sale-${sale.id}`,
        type: "SALE_EVENT",
        user: sale.user.name,
        shop: sale.shop.name,
        message: `Processed a ₵${sale.totalAmount} transaction`,
        severity: sale.totalAmount >= 1000 ? "POSITIVE" : "NEUTRAL",
        timestamp: sale.createdAt
      });
    });

    // 4. DETECT RECENT CHECK-INS
    const attendances = await prisma.attendance.findMany({
      where: {
        checkOut: null,
        user: orgFilter // Filter by organization
      },
      include: {
        user: {
          include: { shop: true }
        }
      },
      orderBy: { checkIn: 'desc' },
      take: 5
    });

    attendances.forEach(a => {
      alerts.push({
        id: `att-${a.id}`,
        type: "CHECK_IN",
        user: a.user.name,
        shop: a.user.shop?.name || "Unknown Branch",
        message: `Signed in for duty`,
        severity: "NEUTRAL",
        timestamp: a.checkIn
      });
    });

    // 5. RECENT FIELD REPORTS
    const reports = await prisma.dailyReport.findMany({
      where: {
        user: orgFilter // Filter by organization
      },
      include: {
        user: {
          include: { shop: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    reports.forEach(r => {
      alerts.push({
        id: `report-${r.id}`,
        type: "FIELD_REPORT",
        user: r.user.name,
        shop: r.user.shop?.name || "Unknown Branch",
        message: `Submitted a field intelligence report`,
        severity: "NEUTRAL",
        timestamp: r.createdAt
      });
    });

    // Final Sort: Most recent first
    alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json(alerts.slice(0, 20));

  } catch (error: any) {
    console.error("❌ PULSE_FEED_ERROR:", error);

    // Check for auth errors
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return handleApiError(error);
    }

    // Return empty array instead of crashing
    return NextResponse.json([]);
  }
}