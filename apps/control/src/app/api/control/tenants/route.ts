import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/require-platform-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePlatformAdmin();

    const organizations = await prisma.organization.findMany({
      include: {
        _count: { select: { shops: true, users: true } },
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({
      success: true,
      data: organizations.map((org) => ({
        id: org.id,
        name: org.name,
        status: org.status,
        users: org._count.users,
        shops: org._count.shops,
        subscription: org.subscriptions[0] || null,
      })),
    });
  } catch {
    return Response.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
  }
}
