import { z } from "zod";
import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { ok } from "@/lib/platform/api-response";
import { parseJsonBody } from "@/lib/platform/validation";

export const dynamic = "force-dynamic";

const createLeaveSchema = z
    .object({
        type: z.string().min(1).max(60),
        startDate: z.string().min(1),
        endDate: z.string().min(1),
        reason: z.string().max(2000).optional(),
    })
    .strip();

const protectedPost = withTenantProtection(
    {
        route: "/api/hr/leaves",
        roles: ["WORKER", "AGENT", "ASSISTANT", "MANAGER", "ADMIN", "SUPER_ADMIN"],
        rateLimit: { keyPrefix: "hr-leaves-create", max: 30, windowMs: 60_000 },
    },
    async (req, ctx) => {
        const body = await parseJsonBody(req, createLeaveSchema);

        const leave = await ctx.scopedPrisma.leaveRequest.create({
            data: {
                userId: ctx.sessionUser.id,
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

        return ok(leave, 201);
    }
);

// POST: Submit a Leave Request (Mobile/Self-Service)
export async function POST(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/hr/leaves", requestId, () => protectedPost(req));
}
