import { prisma } from "@/lib/prisma";

export type PlatformActionType =
  | "PLATFORM_ADMIN_LOGIN"
  | "TENANT_LOCKED"
  | "PLAN_CHANGED"
  | "FEATURE_TOGGLED"
  | "BILLING_STATUS_UPDATED";

export async function logPlatformAction(params: {
  adminId: string;
  actionType: PlatformActionType;
  targetTenantId?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.activityLog.create({
    data: {
      userId: params.adminId,
      userName: "platform-admin",
      userRole: "PLATFORM_ADMIN",
      action: params.actionType,
      entity: "PlatformControl",
      entityId: params.targetTenantId,
      description: `${params.actionType}${params.targetTenantId ? ` for tenant ${params.targetTenantId}` : ""}`,
      metadata: {
        adminId: params.adminId,
        targetTenantId: params.targetTenantId,
        timestamp: new Date().toISOString(),
        ...params.metadata,
      },
    },
  });
}
