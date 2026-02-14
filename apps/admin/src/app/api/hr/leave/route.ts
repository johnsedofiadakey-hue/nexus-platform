import { z } from "zod";
import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { fail, ok } from "@/lib/platform/api-response";
import { parseJsonBody } from "@/lib/platform/validation";
import { enqueueJob } from "@/lib/platform/queue";
import { bootstrapPlatformQueue } from "@/lib/platform/bootstrap";

export const dynamic = "force-dynamic";

const createLeaveSchema = z
    .object({
        type: z.string().min(1).max(60),
        startDate: z.string().min(1),
        endDate: z.string().min(1),
        reason: z.string().max(2000).optional(),
        userId: z.string().min(1),
    })
    .strip();

const updateLeaveSchema = z
    .object({
        leaveId: z.string().min(1),
        status: z.enum(["APPROVED", "REJECTED", "PENDING"]),
    })
    .strip();

const protectedPost = withTenantProtection(
    {
        route: "/api/hr/leave",
        roles: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
        rateLimit: { keyPrefix: "hr-leave-admin-create", max: 25, windowMs: 60_000 },
    },
    async (req, ctx) => {
        bootstrapPlatformQueue();
        const body = await parseJsonBody(req, createLeaveSchema);

        const targetUser = await ctx.scopedPrisma.user.findUnique({
            where: { id: body.userId },
            select: { id: true, name: true },
        });

        if (!targetUser) {
            return fail("USER_NOT_FOUND", "Target user not found or access denied", 403);
        }

        const leave = await ctx.scopedPrisma.leaveRequest.create({
            data: {
                userId: body.userId,
                type: body.type,
                startDate: new Date(body.startDate),
                endDate: new Date(body.endDate),
                reason: body.reason || "",
                status: "PENDING",
            },
            select: {
                id: true,
                userId: true,
                type: true,
                startDate: true,
                endDate: true,
                reason: true,
                status: true,
            },
        });

        if (ctx.orgId) {
            enqueueJob("notification", {
                organizationId: ctx.orgId,
                type: "LEAVE",
                title: "New Leave Request",
                message: `${targetUser.name || "Staff"}: Requested ${body.type.replaceAll("_", " ")}`,
                link: `/dashboard/hr/member/${body.userId}?tab=COMPLIANCE`,
            });
        }

        return ok(leave, 201);
    }
);

const protectedPatch = withTenantProtection(
    {
        route: "/api/hr/leave",
        roles: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
        rateLimit: { keyPrefix: "hr-leave-admin-update", max: 40, windowMs: 60_000 },
    },
    async (req, ctx) => {
        const body = await parseJsonBody(req, updateLeaveSchema);

        const leave = await ctx.scopedPrisma.leaveRequest.findUnique({
            where: { id: body.leaveId },
            select: { id: true },
        });

        if (!leave) {
            return fail("LEAVE_NOT_FOUND", "Leave not found or unauthorized", 403);
        }

        const updated = await ctx.scopedPrisma.leaveRequest.update({
            where: { id: body.leaveId },
            data: { status: body.status },
            select: {
                id: true,
                userId: true,
                type: true,
                startDate: true,
                endDate: true,
                reason: true,
                status: true,
            },
        });

        return ok(updated);
    }
);

// 1. POST: Submit a Leave Request
export async function POST(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/hr/leave", requestId, () => protectedPost(req));
}

export async function PATCH(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/hr/leave", requestId, () => protectedPatch(req));
}
