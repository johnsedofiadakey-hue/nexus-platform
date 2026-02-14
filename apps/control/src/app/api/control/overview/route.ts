import { SubscriptionStatus } from "@nexus/database";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/require-platform-admin";
import { calculateAmount } from "@/lib/subscription-math";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePlatformAdmin();

    const [tenants, subscriptions, shops, invoices] = await Promise.all([
      prisma.organization.count(),
      prisma.subscription.findMany({ include: { plan: true } }),
      prisma.shop.count(),
      prisma.invoice.findMany({ where: { invoiceDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
    ]);

    const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === "ACTIVE").length;
    const lockedTenants = subscriptions.filter((subscription) => subscription.status === "LOCKED").length;
    const graceTenants = subscriptions.filter((subscription) => subscription.status === "GRACE").length;

    let mrr = 0;
    let arr = 0;

    for (const subscription of subscriptions) {
      const shopCount = await prisma.shop.count({ where: { organizationId: subscription.tenantId } });
      const monthlyEquivalent = calculateAmount(shopCount, subscription.plan.pricePerShopMonthly, "MONTHLY", subscription.plan.annualDiscountPercent);
      mrr += monthlyEquivalent;
      arr += calculateAmount(shopCount, subscription.plan.pricePerShopMonthly, "ANNUAL", subscription.plan.annualDiscountPercent);
    }

    const failedInvoices = invoices.filter((invoice) => invoice.status === "FAILED").length;
    const paymentFailureRate = invoices.length > 0 ? failedInvoices / invoices.length : 0;

    return Response.json({
      success: true,
      data: {
        totalTenants: tenants,
        activeSubscriptions,
        lockedTenants,
        graceTenants,
        totalShops: shops,
        mrr,
        arr,
        paymentFailureRate,
      },
    });
  } catch {
    return Response.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
  }
}
