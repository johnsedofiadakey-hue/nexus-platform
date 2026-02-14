import { z } from "zod";
import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { fail, ok } from "@/lib/platform/api-response";
import { parseJsonBody } from "@/lib/platform/validation";

export const dynamic = "force-dynamic";

const bodySchema = z
    .object({
        image: z.string().min(1),
    })
    .strip();

const protectedPost = withTenantProtection(
    {
        route: "/api/mobile/profile/update",
        roles: ["WORKER", "ASSISTANT", "AGENT", "MANAGER", "ADMIN", "SUPER_ADMIN"],
        rateLimit: { keyPrefix: "mobile-profile-write", max: 50, windowMs: 60_000 },
    },
    async (req, ctx) => {
        const body = await parseJsonBody(req, bodySchema);
        if (!body.image) {
            return fail("VALIDATION_ERROR", "No image provided", 400);
        }

        await ctx.scopedPrisma.user.update({
            where: { id: ctx.sessionUser.id },
            data: { image: body.image },
        });

        return ok({ success: true });
    }
);

export async function POST(req: Request) {
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
    return withApiErrorHandling(req, "/api/mobile/profile/update", requestId, () => protectedPost(req));
}
