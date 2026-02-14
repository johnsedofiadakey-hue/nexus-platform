import { z } from "zod";
import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { fail, ok } from "@/lib/platform/api-response";
import { parseJsonBody, parseQuery } from "@/lib/platform/validation";
import { logActivity, logTargetActivity } from "@/lib/activity-logger";

export const dynamic = "force-dynamic";

const getQuerySchema = z
    .object({
        userId: z.string().optional(),
        targetType: z.string().optional(),
        includeHistory: z
            .union([z.literal("true"), z.literal("false")])
            .optional()
            .transform((value) => value === "true"),
    })
    .strip();

const createTargetSchema = z
    .object({
        userId: z.string().optional(),
        targetQuantity: z.coerce.number().int().min(0).optional(),
        targetValue: z.coerce.number().min(0).optional(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        targetType: z.string().optional(),
        achievedValue: z.coerce.number().min(0).optional(),
        achievedQuantity: z.coerce.number().int().min(0).optional(),
    })
    .strip();

const updateTargetSchema = z
    .object({
        id: z.string().optional(),
        targetId: z.string().optional(),
        targetQuantity: z.coerce.number().int().min(0).optional(),
        targetValue: z.coerce.number().min(0).optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        status: z.string().optional(),
        targetType: z.string().optional(),
        achievedValue: z.coerce.number().min(0).optional(),
        achievedQuantity: z.coerce.number().int().min(0).optional(),
    })
    .strip();

const deleteQuerySchema = z
    .object({
        id: z.string().optional(),
        targetId: z.string().optional(),
    })
    .strip();

const protectedGet = withTenantProtection(
    {
        route: "/api/targets",
        roles: ["MANAGER", "ADMIN", "SUPER_ADMIN", "AUDITOR"],
        rateLimit: { keyPrefix: "targets-read", max: 120, windowMs: 60_000 },
    },
    async (req, ctx) => {
        const query = parseQuery(new URL(req.url), getQuerySchema);
        const isSuperAdmin = ctx.sessionUser.role === "SUPER_ADMIN";

        const whereClause: any = {};
        if (query.userId) whereClause.userId = query.userId;
        if (query.targetType) whereClause.targetType = query.targetType;
        if (!isSuperAdmin && !query.userId && !query.targetType && ctx.orgId) {
            whereClause.user = { organizationId: ctx.orgId };
        }

        const baseInclude = {
            user: { select: { name: true, image: true, shop: { select: { name: true } } } },
        };

        const targets = query.includeHistory
            ? await ctx.scopedPrisma.target.findMany({
                    where: whereClause,
                    include: {
                        ...baseInclude,
                        history: { orderBy: { createdAt: "desc" }, take: 50 },
                    },
                    orderBy: { createdAt: "desc" },
                })
            : await ctx.scopedPrisma.target.findMany({
                    where: whereClause,
                    include: baseInclude,
                    orderBy: { createdAt: "desc" },
                });

        return ok(targets);
    }
);

const protectedPost = withTenantProtection(
    {
        route: "/api/targets",
        roles: ["ADMIN", "SUPER_ADMIN"],
        rateLimit: { keyPrefix: "targets-write", max: 40, windowMs: 60_000 },
    },
    async (req, ctx) => {
        const body = await parseJsonBody(req, createTargetSchema);
        const finalUserId = body.targetType === "ADMIN" && !body.userId ? ctx.sessionUser.id : body.userId;

        if (!finalUserId) {
            return fail("VALIDATION_ERROR", "User ID required", 400);
        }

        const targetUser = await ctx.scopedPrisma.user.findUnique({
            where: { id: finalUserId },
            include: { shop: true },
        });

        const target = await ctx.scopedPrisma.target.create({
            data: {
                userId: finalUserId,
                targetQuantity: body.targetQuantity || 0,
                targetValue: body.targetValue || 0,
                achievedQuantity: body.achievedQuantity || 0,
                achievedValue: body.achievedValue || 0,
                startDate: body.startDate,
                endDate: body.endDate,
                status: "ACTIVE",
                targetType: body.targetType || "AGENT",
            },
        });

        await logTargetActivity(
            target.id,
            ctx.sessionUser.id,
            "CREATED",
            null,
            {
                targetQuantity: target.targetQuantity,
                targetValue: target.targetValue,
                startDate: target.startDate,
                endDate: target.endDate,
            },
            0,
            0,
            0,
            `Target created by ${ctx.sessionUser.email}`
        );

        await logActivity({
            userId: ctx.sessionUser.id,
            userName: ctx.sessionUser.email,
            userRole: ctx.sessionUser.role,
            action: "TARGET_CREATED",
            entity: "Target",
            entityId: target.id,
            description: `Created target for ${targetUser?.name || "Unknown"}: ₵${body.targetValue || 0} / ${body.targetQuantity || 0} units`,
            metadata: {
                targetId: target.id,
                userId: finalUserId,
                targetQuantity: body.targetQuantity || 0,
                targetValue: body.targetValue || 0,
            },
            ipAddress: ctx.ip,
            shopId: targetUser?.shopId || undefined,
            shopName: targetUser?.shop?.name || undefined,
        });

        return ok(target, 201);
    }
);

const protectedPatch = withTenantProtection(
    {
        route: "/api/targets",
        roles: ["ADMIN", "SUPER_ADMIN"],
        rateLimit: { keyPrefix: "targets-write", max: 40, windowMs: 60_000 },
    },
    async (req, ctx) => {
        const body = await parseJsonBody(req, updateTargetSchema);
        const finalTargetId = body.id || body.targetId;

        if (!finalTargetId) {
            return fail("VALIDATION_ERROR", "Target ID required", 400);
        }

        const existingTarget = await ctx.scopedPrisma.target.findUnique({
            where: { id: finalTargetId },
            include: { user: { include: { shop: true } } },
        });

        if (!existingTarget) {
            return fail("NOT_FOUND", "Target not found", 404);
        }

        const updatedTarget = await ctx.scopedPrisma.target.update({
            where: { id: finalTargetId },
            data: {
                ...(body.targetQuantity !== undefined && { targetQuantity: body.targetQuantity }),
                ...(body.targetValue !== undefined && { targetValue: body.targetValue }),
                ...(body.achievedQuantity !== undefined && { achievedQuantity: body.achievedQuantity }),
                ...(body.achievedValue !== undefined && { achievedValue: body.achievedValue }),
                ...(body.startDate && { startDate: body.startDate }),
                ...(body.endDate && { endDate: body.endDate }),
                ...(body.status && { status: body.status }),
                ...(body.targetType && { targetType: body.targetType }),
            },
        });

        await logTargetActivity(
            finalTargetId,
            ctx.sessionUser.id,
            "UPDATED",
            {
                targetQuantity: existingTarget.targetQuantity,
                targetValue: existingTarget.targetValue,
                startDate: existingTarget.startDate,
                endDate: existingTarget.endDate,
                status: existingTarget.status,
            },
            {
                targetQuantity: updatedTarget.targetQuantity,
                targetValue: updatedTarget.targetValue,
                startDate: updatedTarget.startDate,
                endDate: updatedTarget.endDate,
                status: updatedTarget.status,
            },
            0,
            0,
            0,
            `Target updated by ${ctx.sessionUser.email}`
        );

        await logActivity({
            userId: ctx.sessionUser.id,
            userName: ctx.sessionUser.email,
            userRole: ctx.sessionUser.role,
            action: "TARGET_UPDATED",
            entity: "Target",
            entityId: finalTargetId,
            description: `Updated target for ${existingTarget.user.name}`,
            metadata: { targetId: finalTargetId, changes: body },
            ipAddress: ctx.ip,
            shopId: existingTarget.user.shopId || undefined,
            shopName: existingTarget.user.shop?.name || undefined,
        });

        return ok(updatedTarget);
    }
);

const protectedDelete = withTenantProtection(
    {
        route: "/api/targets",
        roles: ["ADMIN", "SUPER_ADMIN"],
        rateLimit: { keyPrefix: "targets-write", max: 30, windowMs: 60_000 },
    },
    async (req, ctx) => {
        const query = parseQuery(new URL(req.url), deleteQuerySchema);
        const targetId = query.id || query.targetId;

        if (!targetId) {
            return fail("VALIDATION_ERROR", "Target ID required", 400);
        }

        const existingTarget = await ctx.scopedPrisma.target.findUnique({
            where: { id: targetId },
            include: { user: { include: { shop: true } } },
        });

        if (!existingTarget) {
            return fail("NOT_FOUND", "Target not found", 404);
        }

        await logTargetActivity(
            targetId,
            ctx.sessionUser.id,
            "DELETED",
            {
                targetQuantity: existingTarget.targetQuantity,
                targetValue: existingTarget.targetValue,
                startDate: existingTarget.startDate,
                endDate: existingTarget.endDate,
                status: existingTarget.status,
            },
            null,
            0,
            0,
            0,
            `Target deleted by ${ctx.sessionUser.email}`
        );

        await ctx.scopedPrisma.target.delete({ where: { id: targetId } });

        await logActivity({
            userId: ctx.sessionUser.id,
            userName: ctx.sessionUser.email,
            userRole: ctx.sessionUser.role,
            action: "TARGET_DELETED",
            entity: "Target",
            entityId: targetId,
            description: `Deleted target for ${existingTarget.user.name}`,
            metadata: { targetId, deletedTarget: existingTarget },
            ipAddress: ctx.ip,
            shopId: existingTarget.user.shopId || undefined,
            shopName: existingTarget.user.shop?.name || undefined,
        });

        return ok({ message: "Target deleted" });
    }
);

export async function GET(req: Request) {
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
    return withApiErrorHandling(req, "/api/targets", requestId, () => protectedGet(req));
}

export async function POST(req: Request) {
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
    return withApiErrorHandling(req, "/api/targets", requestId, () => protectedPost(req));
}

export async function PATCH(req: Request) {
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
    return withApiErrorHandling(req, "/api/targets", requestId, () => protectedPatch(req));
}

export async function DELETE(req: Request) {
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
    return withApiErrorHandling(req, "/api/targets", requestId, () => protectedDelete(req));
}

