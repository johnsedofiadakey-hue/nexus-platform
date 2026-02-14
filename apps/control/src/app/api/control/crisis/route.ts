import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/require-platform-admin";
import { logPlatformAction } from "@/lib/platform-audit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  action: z.enum(["SET_READ_ONLY", "EMERGENCY_FREEZE", "FORCE_PASSWORD_RESET"]),
  enabled: z.boolean().optional(),
  tenantId: z.string().optional(),
});

export async function GET() {
  try {
    await requirePlatformAdmin();

    const [readOnly, cronLastRun, paymentFailures] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: "SYSTEM_READ_ONLY" } }),
      prisma.systemSetting.findUnique({ where: { key: "CRON_LAST_RUN_AT" } }),
      prisma.auditLog.count({ where: { action: "PAYMENT_WEBHOOK_FAILED" } }),
    ]);

    return Response.json({
      success: true,
      data: {
        systemReadOnly: readOnly?.value === "true",
        cronLastRun: cronLastRun?.value || null,
        paymentWebhookFailures: paymentFailures,
      },
    });
  } catch {
    return Response.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requirePlatformAdmin();
    const payload = bodySchema.parse(await req.json());

    if (payload.action === "SET_READ_ONLY") {
      await prisma.systemSetting.upsert({
        where: { key: "SYSTEM_READ_ONLY" },
        update: { value: payload.enabled ? "true" : "false" },
        create: { key: "SYSTEM_READ_ONLY", value: payload.enabled ? "true" : "false" },
      });

      await logPlatformAction({
        adminId: admin.id,
        actionType: "BILLING_STATUS_UPDATED",
        metadata: { setting: "SYSTEM_READ_ONLY", enabled: payload.enabled },
      });

      return Response.json({ success: true });
    }

    if (!payload.tenantId) {
      return Response.json({ success: false, error: { code: "VALIDATION", message: "tenantId required" } }, { status: 400 });
    }

    if (payload.action === "EMERGENCY_FREEZE") {
      await prisma.$transaction([
        prisma.subscription.updateMany({ where: { tenantId: payload.tenantId }, data: { status: "LOCKED" } }),
        prisma.organization.update({ where: { id: payload.tenantId }, data: { status: "LOCKED_PAYMENT" } }),
      ]);

      await logPlatformAction({
        adminId: admin.id,
        actionType: "TENANT_LOCKED",
        targetTenantId: payload.tenantId,
        metadata: { emergency: true },
      });

      return Response.json({ success: true });
    }

    await prisma.$transaction([
      prisma.organization.update({ where: { id: payload.tenantId }, data: { authVersion: { increment: 1 } } }),
      prisma.user.updateMany({ where: { organizationId: payload.tenantId }, data: { passwordResetRequired: true } }),
    ]);

    await logPlatformAction({
      adminId: admin.id,
      actionType: "BILLING_STATUS_UPDATED",
      targetTenantId: payload.tenantId,
      metadata: { action: "FORCE_PASSWORD_RESET" },
    });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ success: false, error: { code: "VALIDATION", message: error.message } }, { status: 400 });
    }
    return Response.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
  }
}
