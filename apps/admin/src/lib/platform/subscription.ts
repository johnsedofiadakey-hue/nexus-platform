import { BillingCycle, SubscriptionStatus } from "@nexus/database";

export function calculateSubscriptionAmount(params: {
  shops: number;
  pricePerShopMonthly: number;
  billingCycle: BillingCycle;
  annualDiscountPercent: number;
}): number {
  const baseMonthly = params.shops * params.pricePerShopMonthly;

  if (params.billingCycle === "ANNUAL") {
    const yearly = baseMonthly * 12;
    return yearly * (1 - params.annualDiscountPercent / 100);
  }

  return baseMonthly;
}

export function applyPaymentFailureGrace(from = new Date()): Date {
  const grace = new Date(from);
  grace.setDate(grace.getDate() + 5);
  return grace;
}

export function resolveSubscriptionStatus(status: SubscriptionStatus, graceEndsAt: Date | null): SubscriptionStatus {
  if (status !== "GRACE") {
    return status;
  }

  if (!graceEndsAt) {
    return "LOCKED";
  }

  return graceEndsAt.getTime() < Date.now() ? "LOCKED" : "GRACE";
}
