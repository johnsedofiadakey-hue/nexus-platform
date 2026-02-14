import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { ok, fail } from "@/lib/platform/api-response";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET - Fetch current org's subscription info
const protectedGet = withTenantProtection(
    {
        route: "/api/subscription",
        roles: ["ADMIN", "SUPER_ADMIN", "MANAGER"],
        rateLimit: { keyPrefix: "subscription-read", max: 60, windowMs: 60_000 },
    },
    async (_req, ctx) => {
        const orgId = ctx.orgId;
        if (!orgId) {
            return fail("NOT_FOUND", "No organization found", 404);
        }

        // Get org with subscription and plan data
        const org = await prisma.organization.findUnique({
            where: { id: orgId },
            select: {
                id: true,
                name: true,
                plan: true,
                status: true,
                nextBillingDate: true,
                subscriptions: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    include: {
                        plan: true,
                    },
                },
                invoices: {
                    orderBy: { invoiceDate: "desc" },
                    take: 5,
                },
                _count: {
                    select: {
                        shops: true,
                        users: true,
                    },
                },
            },
        });

        if (!org) {
            return fail("NOT_FOUND", "Organization not found", 404);
        }

        const subscription = org.subscriptions[0] || null;
        const plan = subscription?.plan || null;

        // Calculate billing amount
        let monthlyAmount = 0;
        let annualAmount = 0;
        if (plan) {
            monthlyAmount = org._count.shops * plan.pricePerShopMonthly;
            annualAmount = monthlyAmount * 12 * (1 - plan.annualDiscountPercent / 100);
        }

        return ok({
            organization: {
                id: org.id,
                name: org.name,
                status: org.status,
            },
            subscription: subscription
                ? {
                      id: subscription.id,
                      status: subscription.status,
                      billingCycle: subscription.billingCycle,
                      nextBillingDate: subscription.nextBillingDate,
                      graceEndsAt: subscription.graceEndsAt,
                  }
                : null,
            plan: plan
                ? {
                      id: plan.id,
                      name: plan.name,
                      pricePerShopMonthly: plan.pricePerShopMonthly,
                      annualDiscountPercent: plan.annualDiscountPercent,
                      features: plan.features,
                  }
                : null,
            usage: {
                shops: org._count.shops,
                users: org._count.users,
            },
            billing: {
                monthlyAmount,
                annualAmount,
                currentAmount:
                    subscription?.billingCycle === "ANNUAL"
                        ? annualAmount
                        : monthlyAmount,
                cycle: subscription?.billingCycle || "MONTHLY",
            },
            invoices: org.invoices.map((inv) => ({
                id: inv.id,
                amount: inv.amount,
                status: inv.status,
                date: inv.invoiceDate,
                paidDate: inv.paidDate,
            })),
        });
    }
);

// GET all available plans (for upgrade modal)
const protectedGetPlans = withTenantProtection(
    {
        route: "/api/subscription",
        roles: ["ADMIN", "SUPER_ADMIN", "MANAGER"],
        rateLimit: { keyPrefix: "subscription-plans", max: 30, windowMs: 60_000 },
    },
    async (req, ctx) => {
        const { searchParams } = new URL(req.url);
        if (searchParams.get("action") !== "plans") {
            return null; // Fallback to main GET
        }

        const plans = await prisma.plan.findMany({
            orderBy: { pricePerShopMonthly: "asc" },
        });

        return ok(plans);
    }
);

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    if (searchParams.get("action") === "plans") {
        return protectedGetPlans(req);
    }

    return protectedGet(req);
}
