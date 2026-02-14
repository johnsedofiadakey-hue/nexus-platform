import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/require-platform-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePlatformAdmin();

    const now = Date.now();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);

    const [totalEvents, errorEvents, recentErrors, cronLastRun, paymentFailures] = await Promise.all([
      prisma.activityLog.count({ where: { createdAt: { gte: last24h } } }),
      prisma.activityLog.count({ where: { createdAt: { gte: last24h }, action: { contains: "ERROR", mode: "insensitive" } } }),
      prisma.activityLog.findMany({
        where: {
          createdAt: { gte: last24h },
          OR: [
            { action: { contains: "500" } },
            { action: { contains: "ERROR", mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.systemSetting.findUnique({ where: { key: "CRON_LAST_RUN_AT" } }),
      prisma.auditLog.count({ where: { action: "PAYMENT_WEBHOOK_FAILED" } }),
    ]);

    let dbStatus: "ok" | "error" = "ok";
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = "error";
    }

    const apiErrorRate = totalEvents > 0 ? errorEvents / totalEvents : 0;

    return Response.json({
      success: true,
      data: {
        apiErrorRate,
        recent500Logs: recentErrors,
        cronJobLastRun: cronLastRun?.value || null,
        dbConnectionStatus: dbStatus,
        paymentWebhookFailures: paymentFailures,
      },
    });
  } catch {
    return Response.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
  }
}
