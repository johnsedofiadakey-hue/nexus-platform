import { prisma } from "@/lib/prisma";
import { resolveSubscriptionStatus } from "@/lib/platform/subscription";

export type TenantEnforcement = {
  tenantId: string | null;
  subscriptionStatus: "ACTIVE" | "GRACE" | "LOCKED" | "CANCELLED";
  graceEndsAt: string | null;
  systemReadOnly: boolean;
  authVersion: number;
  planName: string;
};

export async function getTenantEnforcement(tenantId: string | null): Promise<TenantEnforcement> {
  const readOnlySetting = await prisma.systemSetting.findUnique({ where: { key: "SYSTEM_READ_ONLY" } });
  const systemReadOnly = readOnlySetting?.value === "true";

  if (!tenantId) {
    return {
      tenantId: null,
      subscriptionStatus: "ACTIVE",
      graceEndsAt: null,
      systemReadOnly,
      authVersion: 1,
      planName: "Starter",
    };
  }

  const [organization, subscription] = await Promise.all([
    prisma.organization.findUnique({ where: { id: tenantId }, select: { authVersion: true } }),
    prisma.subscription.findFirst({
      where: { tenantId },
      include: { plan: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!subscription) {
    return {
      tenantId,
      subscriptionStatus: "LOCKED",
      graceEndsAt: null,
      systemReadOnly,
      authVersion: organization?.authVersion ?? 1,
      planName: "Starter",
    };
  }

  const status = resolveSubscriptionStatus(subscription.status, subscription.graceEndsAt);

  if (status !== subscription.status) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status },
    });
  }

  return {
    tenantId,
    subscriptionStatus: status,
    graceEndsAt: subscription.graceEndsAt ? subscription.graceEndsAt.toISOString() : null,
    systemReadOnly,
    authVersion: organization?.authVersion ?? 1,
    planName: subscription.plan.name,
  };
}
