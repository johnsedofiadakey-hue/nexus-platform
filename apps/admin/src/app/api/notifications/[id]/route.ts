import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { fail, ok } from "@/lib/platform/api-response";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

    return withApiErrorHandling(req, "/api/notifications/[id]", requestId, async () => {
        const { id } = await props.params;

        const protectedPatch = withTenantProtection(
            {
                route: "/api/notifications/[id]",
                roles: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
                rateLimit: { keyPrefix: "notifications-update", max: 60, windowMs: 60_000 },
            },
            async (_request, ctx) => {
                const existing = await ctx.scopedPrisma.notification.findUnique({ where: { id }, select: { id: true } });
                if (!existing) {
                    return fail("NOTIFICATION_NOT_FOUND", "Notification not found", 404);
                }

                const notification = await ctx.scopedPrisma.notification.update({
                    where: { id },
                    data: { isRead: true },
                    select: {
                        id: true,
                        type: true,
                        title: true,
                        message: true,
                        link: true,
                        isRead: true,
                        createdAt: true,
                    },
                });

                return ok(notification);
            }
        );

        return protectedPatch(req);
    });
}
