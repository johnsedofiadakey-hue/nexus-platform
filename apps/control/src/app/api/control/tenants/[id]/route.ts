import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/require-platform-admin";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    await requirePlatformAdmin();
    const { id } = await props.params;

    const tenant = await prisma.organization.findUnique({
      where: { id },
      include: {
        _count: { select: { shops: true, users: true } },
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!tenant) {
      return Response.json({ success: false, error: { code: "NOT_FOUND", message: "Tenant not found" } }, { status: 404 });
    }

    const shopIds = await prisma.shop.findMany({ where: { organizationId: id }, select: { id: true } });
    const logs = await prisma.activityLog.findMany({
      where: { shopId: { in: shopIds.map((shop) => shop.id) } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return Response.json({
      success: true,
      data: {
        tenant,
        logs,
      },
    });
  } catch {
    return Response.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
  }
}
