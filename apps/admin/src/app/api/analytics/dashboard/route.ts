import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { ok } from "@/lib/platform/api-response";

export const dynamic = "force-dynamic";

const protectedGet = withTenantProtection(
  {
    route: "/api/analytics/dashboard",
    roles: ["MANAGER", "ADMIN", "SUPER_ADMIN", "AUDITOR"],
    rateLimit: { keyPrefix: "analytics-dashboard-read", max: 90, windowMs: 60_000 },
  },
  async (_req, ctx) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const revenueAgg = await ctx.scopedPrisma.sale.aggregate({
      where: { createdAt: { gte: today } },
      _sum: { totalAmount: true },
    });

    const activeStaffCount = await ctx.scopedPrisma.attendance.count({
      where: { date: { gte: today }, checkOut: null },
    });

    const inventoryRows = await ctx.scopedPrisma.product.findMany({
      select: { buyingPrice: true, stockLevel: true },
    });
    const inventoryValue = inventoryRows.reduce((sum, row) => sum + row.buyingPrice * row.stockLevel, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSales = await ctx.scopedPrisma.sale.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, totalAmount: true },
    });

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const chartMap = new Map<string, number>();
    recentSales.forEach((entry) => {
      const dayName = days[entry.createdAt.getDay()];
      chartMap.set(dayName, (chartMap.get(dayName) || 0) + entry.totalAmount);
    });

    const chartData = Array.from(chartMap).map(([name, sales]) => ({ name, sales }));

    const shops = await ctx.scopedPrisma.shop.findMany({
      take: 5,
      include: {
        sales: { where: { createdAt: { gte: today } }, select: { totalAmount: true } },
      },
    });

    const shopPerformance = shops
      .map((shop) => ({
        name: shop.name,
        revenue: shop.sales.reduce((acc, sale) => acc + sale.totalAmount, 0),
      }))
      .sort((left, right) => right.revenue - left.revenue);

    let adminTarget = null;
    const activeTarget = await ctx.scopedPrisma.target.findFirst({
      where: {
        userId: ctx.sessionUser.id,
        status: "ACTIVE",
        endDate: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (activeTarget) {
      const periodPerformance = await ctx.scopedPrisma.sale.aggregate({
        where: { createdAt: { gte: activeTarget.startDate, lte: activeTarget.endDate } },
        _sum: { totalAmount: true },
      });

      const itemsPerformance = await ctx.scopedPrisma.saleItem.aggregate({
        where: { sale: { createdAt: { gte: activeTarget.startDate, lte: activeTarget.endDate } } },
        _sum: { quantity: true },
      });

      adminTarget = {
        ...activeTarget,
        currentRevenue: periodPerformance._sum.totalAmount || 0,
        currentVolume: itemsPerformance._sum.quantity || 0,
      };
    }

    return ok({
      revenue: revenueAgg._sum.totalAmount || 0,
      activeStaff: activeStaffCount,
      inventoryValue,
      chartData: chartData.length > 0 ? chartData : [{ name: "Today", sales: 0 }],
      shopPerformance,
      adminTarget,
    });
  }
);

export async function GET(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/analytics/dashboard", requestId, () => protectedGet(req));
}