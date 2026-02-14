import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { ok } from "@/lib/platform/api-response";

export const dynamic = "force-dynamic";

const protectedGet = withTenantProtection(
  {
    route: "/api/operations/pulse-feed",
    roles: ["MANAGER", "ADMIN", "SUPER_ADMIN", "AUDITOR"],
    rateLimit: { keyPrefix: "operations-pulse-feed-read", max: 90, windowMs: 60_000 },
  },
  async (_req, ctx) => {
    const alerts: Array<{
      id: string;
      type: string;
      user: string;
      shop: string;
      message: string;
      severity: string;
      timestamp: Date;
    }> = [];
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

    const [ghosts, lowStock, bigSales, attendances, reports] = await Promise.all([
      ctx.scopedPrisma.user.findMany({
        where: {
          role: "WORKER",
          status: "ACTIVE",
          attendance: { some: { checkOut: null, checkIn: { lte: fourHoursAgo } } },
          sales: { none: { createdAt: { gte: fourHoursAgo } } },
        },
        select: { id: true, name: true, shop: { select: { name: true } } },
        take: 5,
      }),
      ctx.scopedPrisma.product.findMany({
        where: { stockLevel: { lte: 5 } },
        select: { id: true, name: true, stockLevel: true, shop: { select: { name: true } } },
        take: 3,
      }),
      ctx.scopedPrisma.sale.findMany({
        where: { createdAt: { gte: fourHoursAgo } },
        select: {
          id: true,
          totalAmount: true,
          createdAt: true,
          user: { select: { name: true } },
          shop: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      ctx.scopedPrisma.attendance.findMany({
        where: { checkOut: null, checkIn: { gte: fourHoursAgo } },
        select: {
          id: true,
          checkIn: true,
          user: { select: { name: true, shop: { select: { name: true } } } },
        },
        orderBy: { checkIn: "desc" },
        take: 5,
      }),
      ctx.scopedPrisma.dailyReport.findMany({
        where: { createdAt: { gte: fourHoursAgo } },
        select: {
          id: true,
          createdAt: true,
          user: { select: { name: true, shop: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    ghosts.forEach((ghost) => {
      alerts.push({
        id: `ghost-${ghost.id}`,
        type: "GHOST_ALERT",
        user: ghost.name || "Unknown",
        shop: ghost.shop?.name || "Unknown Branch",
        message: "No activity recorded in 4+ hours",
        severity: "HIGH",
        timestamp: new Date(),
      });
    });

    lowStock.forEach((item) => {
      alerts.push({
        id: `stock-${item.id}`,
        type: "STOCK_LOW",
        user: "System",
        shop: item.shop?.name || "Unknown Branch",
        message: `${item.name} is running low (${item.stockLevel} left)`,
        severity: "MEDIUM",
        timestamp: new Date(),
      });
    });

    bigSales.forEach((sale) => {
      alerts.push({
        id: `sale-${sale.id}`,
        type: "SALE_EVENT",
        user: sale.user.name || "Unknown",
        shop: sale.shop.name,
        message: `Processed a ₵${sale.totalAmount} transaction`,
        severity: sale.totalAmount >= 1000 ? "POSITIVE" : "NEUTRAL",
        timestamp: sale.createdAt,
      });
    });

    attendances.forEach((attendance) => {
      alerts.push({
        id: `att-${attendance.id}`,
        type: "CHECK_IN",
        user: attendance.user.name || "Unknown",
        shop: attendance.user.shop?.name || "Unknown Branch",
        message: "Signed in for duty",
        severity: "NEUTRAL",
        timestamp: attendance.checkIn,
      });
    });

    reports.forEach((report) => {
      alerts.push({
        id: `report-${report.id}`,
        type: "FIELD_REPORT",
        user: report.user.name || "Unknown",
        shop: report.user.shop?.name || "Unknown Branch",
        message: "Submitted a field intelligence report",
        severity: "NEUTRAL",
        timestamp: report.createdAt,
      });
    });

    alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return ok(alerts.slice(0, 20));
  }
);

export async function GET(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/operations/pulse-feed", requestId, () => protectedGet(req));
}