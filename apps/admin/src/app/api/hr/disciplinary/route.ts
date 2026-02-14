import { z } from "zod";
import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { fail, ok } from "@/lib/platform/api-response";
import { parseJsonBody } from "@/lib/platform/validation";

export const dynamic = "force-dynamic";

const bodySchema = z
    .object({
        userId: z.string().min(1),
        type: z.string().min(1),
        severity: z.string().min(1),
        description: z.string().optional(),
    })
    .strip();

const protectedPost = withTenantProtection(
    {
        route: "/api/hr/disciplinary",
        roles: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
        rateLimit: { keyPrefix: "hr-disciplinary-write", max: 40, windowMs: 60_000 },
    },
    async (req, ctx) => {
        if (!ctx.orgId && ctx.sessionUser.role !== "SUPER_ADMIN") {
            return fail("UNAUTHORIZED", "Unauthorized", 401);
        }

        const body = await parseJsonBody(req, bodySchema);

        const targetUser = await ctx.scopedPrisma.user.findFirst({
            where: { id: body.userId },
        });

        if (!targetUser) {
            return fail("FORBIDDEN", "User not found or access denied", 403);
        }

        const record = await ctx.scopedPrisma.disciplinaryRecord.create({
            data: {
                userId: body.userId,
                type: body.type,
                severity: body.severity,
                description: body.description || "Manual Citation",
                actionTaken: "WARNING_ISSUED",
            },
        });

        return ok(record, 201);
    }
);

export async function POST(req: Request) {
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
    return withApiErrorHandling(req, "/api/hr/disciplinary", requestId, () => protectedPost(req));
}
