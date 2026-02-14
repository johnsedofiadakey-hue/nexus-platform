import { prisma } from "@/lib/prisma";

export type FeatureCheckInput = {
  featureKey: string;
  tenantId: string;
  plan: string;
};

export async function checkFeature(input: FeatureCheckInput): Promise<boolean> {
  const flag = await prisma.featureFlag.findUnique({ where: { key: input.featureKey } });
  if (!flag) {
    return true;
  }

  if (!flag.enabledGlobally) {
    return false;
  }

  if (flag.planRestrictions.length > 0 && !flag.planRestrictions.includes(input.plan)) {
    return false;
  }

  if (!flag.tenantOverrides || typeof flag.tenantOverrides !== "object") {
    return true;
  }

  const overrides = flag.tenantOverrides as Record<string, unknown>;
  const tenantOverride = overrides[input.tenantId];

  if (typeof tenantOverride === "boolean") {
    return tenantOverride;
  }

  return true;
}

export function featureKeyFromRoute(route: string): string | null {
  if (route.startsWith("/api/messages") || route.startsWith("/api/mobile/messages")) {
    return "messaging";
  }
  if (route.startsWith("/api/mobile/location") || route.startsWith("/api/mobile/pulse")) {
    return "gps-tracking";
  }
  if (route.startsWith("/api/analytics")) {
    return "analytics";
  }
  if (route.startsWith("/api/hr")) {
    return "hr-suite";
  }
  if (route.startsWith("/api/mobile")) {
    return "mobile-pos";
  }

  return null;
}
