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

    const alerts = [];
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

    // ⚡️ OPTIMIZED: Execute all queries in parallel for speed
    const [ghosts, lowStock, bigSales, attendances, reports] = await Promise.all([
      // 1. DETECT "GHOST" WORKERS (Logged in but no sales in 4 hours)
      prisma.user.findMany({
        where: {
          ...orgFilter,
          role: "WORKER",
          status: "ACTIVE",
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
      }),

      // 2. DETECT LOW STOCK - ⚡️ OPTIMIZED with select
      prisma.product.findMany({
        where: {
          stockLevel: { lte: 5 },
          shop: orgFilter
        },
        select: {
          id: true,
          name: true,
          stockLevel: true,
          shop: { select: { name: true } }
        },
        take: 3
      }),

      // 3. DETECT HIGH VALUE SALES - ⚡️ OPTIMIZED with select
      prisma.sale.findMany({
        where: {
          shop: orgFilter,
          createdAt: { gte: fourHoursAgo } // Only recent sales for performance
        },
        select: {
          id: true,
          totalAmount: true,
          createdAt: true,
          user: { select: { name: true } },
          shop: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),

      // 4. DETECT RECENT CHECK-INS - ⚡️ OPTIMIZED with select
      prisma.attendance.findMany({
        where: {
          checkOut: null,
          checkIn: { gte: fourHoursAgo }, // Only recent check-ins
          user: orgFilter
        },
        select: {
          id: true,
          checkIn: true,
          user: {
            select: {
              name: true,
              shop: { select: { name: true } }
            }
          }
        },
        orderBy: { checkIn: 'desc' },
        take: 5
      }),

      // 5. RECENT FIELD REPORTS - ⚡️ OPTIMIZED with select
      prisma.dailyReport.findMany({
        where: {
          user: orgFilter,
          createdAt: { gte: fourHoursAgo } // Only recent reports
        },
        select: {
          id: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              shop: { select: { name: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

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

    // Format Low Stock Alerts
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

    // Format Sale Events
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

    // Format Attendance Events
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

    // Format Report Events
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