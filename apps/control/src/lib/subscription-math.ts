import { BillingCycle } from "@nexus/database";

export function calculateAmount(shops: number, pricePerShopMonthly: number, billingCycle: BillingCycle, annualDiscountPercent: number): number {
  if (billingCycle === "ANNUAL") {
    return shops * pricePerShopMonthly * 12 * (1 - annualDiscountPercent / 100);
  }
  return shops * pricePerShopMonthly;
}

export function graceEndsAtFromNow(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 5);
  return date;
}
