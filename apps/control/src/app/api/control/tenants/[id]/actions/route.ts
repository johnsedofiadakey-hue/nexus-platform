import { z } from "zod";
import { SubscriptionStatus } from "@nexus/database";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/require-platform-admin";
import { graceEndsAtFromNow } from "@/lib/subscription-math";
import { logPlatformAction } from "@/lib/platform-audit";

export const dynamic = "force-dynamic";

const actionSchema = z.object({
  action: z.enum([
    "LOCK_TENANT",
    "UNLOCK_TENANT",
    "CHANGE_PLAN",
    "CHANGE_BILLING_CYCLE",
    "FORCE_GRACE",
    "IMPERSONATE_READONLY",
    "EMERGENCY_FREEZE",
    "FORCE_PASSWORD_RESET",
  ]),
  planId: z.string().optional(),
  billingCycle: z.enum(["MONTHLY", "ANNUAL"]).optional(),
});

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requirePlatformAdmin();
    const { id } = await props.params;
    const payload = actionSchema.parse(await req.json());

    const subscription = await prisma.subscription.findFirst({
      where: { tenantId: id },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription && payload.action !== "IMPERSONATE_READONLY") {
      return Response.json({ success: false, error: { code: "NOT_FOUND", message: "Subscription not found" } }, { status: 404 });
    }

    switch (payload.action) {
      case "LOCK_TENANT":
      case "EMERGENCY_FREEZE": {
        await prisma.$transaction([
          prisma.subscription.update({ where: { id: subscription!.id }, data: { status: "LOCKED" } }),
          prisma.organization.update({ where: { id }, data: { status: "LOCKED_PAYMENT" } }),
        ]);
        await logPlatformAction({
          adminId: admin.id,
          actionType: "TENANT_LOCKED",
          targetTenantId: id,
          metadata: { emergency: payload.action === "EMERGENCY_FREEZE" },
        });
        break;
      }
      case "UNLOCK_TENANT": {
        await prisma.$transaction([
          prisma.subscription.update({ where: { id: subscription!.id }, data: { status: "ACTIVE", graceEndsAt: null } }),
          prisma.organization.update({ where: { id }, data: { status: "ACTIVE" } }),
        ]);
        await logPlatformAction({
          adminId: admin.id,
          actionType: "BILLING_STATUS_UPDATED",
          targetTenantId: id,
          metadata: { status: "ACTIVE" },
        });
        break;
      }
      case "CHANGE_PLAN": {
        if (!payload.planId) {
          return Response.json({ success: false, error: { code: "VALIDATION", message: "planId is required" } }, { status: 400 });
        }

        await prisma.subscription.update({ where: { id: subscription!.id }, data: { planId: payload.planId } });
        await logPlatformAction({
          adminId: admin.id,
          actionType: "PLAN_CHANGED",
          targetTenantId: id,
          metadata: { planId: payload.planId },
        });
        break;
      }
      case "CHANGE_BILLING_CYCLE": {
        if (!payload.billingCycle) {
          return Response.json({ success: false, error: { code: "VALIDATION", message: "billingCycle is required" } }, { status: 400 });
        }

        await prisma.subscription.update({ where: { id: subscription!.id }, data: { billingCycle: payload.billingCycle } });
        await logPlatformAction({
          adminId: admin.id,
          actionType: "BILLING_STATUS_UPDATED",
          targetTenantId: id,
          metadata: { billingCycle: payload.billingCycle },
        });
        break;
      }
      case "FORCE_GRACE": {
        await prisma.subscription.update({
          where: { id: subscription!.id },
          data: {
            status: "GRACE",
            graceEndsAt: graceEndsAtFromNow(),
          },
        });
        await logPlatformAction({
          adminId: admin.id,
          actionType: "BILLING_STATUS_UPDATED",
          targetTenantId: id,
          metadata: { status: "GRACE" },
        });
        break;
      }
      case "FORCE_PASSWORD_RESET": {
        await prisma.$transaction([
          prisma.organization.update({ where: { id }, data: { authVersion: { increment: 1 } } }),
          prisma.user.updateMany({ where: { organizationId: id }, data: { passwordResetRequired: true } }),
        ]);
        await logPlatformAction({
          adminId: admin.id,
          actionType: "BILLING_STATUS_UPDATED",
          targetTenantId: id,
          metadata: { action: "FORCE_PASSWORD_RESET" },
        });
        break;
      }
      case "IMPERSONATE_READONLY": {
        const impersonationToken = `readonly-${id}-${Date.now()}`;
        return Response.json({
          success: true,
          data: {
            mode: "readonly",
            tenantId: id,
            token: impersonationToken,
          },
        });
      }
      default:
        break;
    }

    return Response.json({ success: true, data: { action: payload.action, tenantId: id } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ success: false, error: { code: "VALIDATION", message: error.message } }, { status: 400 });
    }

    return Response.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
  }
}
