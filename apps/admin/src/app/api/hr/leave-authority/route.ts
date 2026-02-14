import { z } from "zod";
import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { fail, ok } from "@/lib/platform/api-response";
import { parseJsonBody } from "@/lib/platform/validation";

export const dynamic = "force-dynamic";

const submitSchema = z
  .object({
    type: z.string().min(1),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reason: z.string().min(1),
  })
  .strip();

const decisionSchema = z
  .object({
    leaveId: z.string().min(1),
    status: z.enum(["APPROVED", "REJECTED", "RECALLED", "PENDING"]),
  })
  .strip();

const protectedPost = withTenantProtection(
  {
    route: "/api/hr/leave-authority",
    roles: ["WORKER", "ASSISTANT", "AGENT", "MANAGER", "ADMIN", "SUPER_ADMIN"],
    rateLimit: { keyPrefix: "leave-authority-write", max: 40, windowMs: 60_000 },
  },
  async (req, ctx) => {
    const body = await parseJsonBody(req, submitSchema);

    const leave = await ctx.scopedPrisma.leaveRequest.create({
      data: {
        userId: ctx.sessionUser.id,
        type: body.type,
        startDate: body.startDate,
        endDate: body.endDate,
        reason: body.reason,
        status: "PENDING",
      },
    });

    return ok({ leave }, 201);
  }
);

const protectedPatch = withTenantProtection(
  {
    route: "/api/hr/leave-authority",
    roles: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
    rateLimit: { keyPrefix: "leave-authority-manage", max: 40, windowMs: 60_000 },
  },
  async (req, ctx) => {
    const body = await parseJsonBody(req, decisionSchema);

    if (ctx.sessionUser.role !== "SUPER_ADMIN" && !ctx.orgId) {
      return fail("UNAUTHORIZED", "Unauthorized", 401);
    }

    const updatedLeave = await ctx.scopedPrisma.leaveRequest.update({
      where: { id: body.leaveId },
      data: { status: body.status },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    return ok({ message: `Leave has been ${body.status.toLowerCase()} successfully.`, data: updatedLeave });
  }
);

export async function POST(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/hr/leave-authority", requestId, () => protectedPost(req));
}

export async function PATCH(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/hr/leave-authority", requestId, () => protectedPatch(req));
}