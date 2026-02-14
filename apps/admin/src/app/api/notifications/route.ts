import { z } from "zod";
import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { fail, ok } from "@/lib/platform/api-response";
import { parseJsonBody } from "@/lib/platform/validation";

export const dynamic = "force-dynamic";

const createNotificationSchema = z
    .object({
        type: z.string().min(1).max(60),
        title: z.string().min(1).max(200),
        message: z.string().min(1).max(4000),
        link: z.string().max(500).optional(),
    })
    .strip();

const protectedGet = withTenantProtection(
    {
        route: "/api/notifications",
        roles: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
        rateLimit: { keyPrefix: "notifications-read", max: 120, windowMs: 60_000 },
    },
    async (_req, ctx) => {
        const notifications = await ctx.scopedPrisma.notification.findMany({
            orderBy: { createdAt: "desc" },
            take: 20,
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

        const unreadCount = await ctx.scopedPrisma.notification.count({
            where: { isRead: false },
        });

        return ok({ notifications, unreadCount });
    }
);

const protectedPost = withTenantProtection(
    {
        route: "/api/notifications",
        roles: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
        rateLimit: { keyPrefix: "notifications-write", max: 40, windowMs: 60_000 },
    },
    async (req, ctx) => {
        if (!ctx.orgId) {
            return fail("ORGANIZATION_REQUIRED", "Organization is required", 400);
        }

        const body = await parseJsonBody(req, createNotificationSchema);
        const notification = await ctx.scopedPrisma.notification.create({
            data: {
                type: body.type,
                title: body.title,
                message: body.message,
                link: body.link,
                organization: { connect: { id: ctx.orgId } },
            },
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

        return ok(notification, 201);
    }
);

export async function GET(req: Request) {
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
    return withApiErrorHandling(req, "/api/notifications", requestId, () => protectedGet(req));
}

export async function POST(req: Request) {
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
    return withApiErrorHandling(req, "/api/notifications", requestId, () => protectedPost(req));
}
