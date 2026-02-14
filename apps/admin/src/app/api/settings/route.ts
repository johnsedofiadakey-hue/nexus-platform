import { z } from "zod";
import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { fail, ok } from "@/lib/platform/api-response";
import { parseJsonBody } from "@/lib/platform/validation";

export const dynamic = "force-dynamic";

const patchSchema = z
    .object({
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        accentColor: z.string().optional(),
        logoUrl: z.string().nullable().optional(),
        name: z.string().optional(),
        planType: z.string().optional(),
    })
    .strip();

const protectedGet = withTenantProtection(
    {
        route: "/api/settings",
        roles: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
        rateLimit: { keyPrefix: "settings-read", max: 90, windowMs: 60_000 },
    },
    async (_req, ctx) => {
        let org = null;
        if (ctx.orgId) {
            org = await ctx.scopedPrisma.organization.findUnique({ where: { id: ctx.orgId } });
        } else {
            org = await ctx.scopedPrisma.organization.findFirst();
            if (!org) {
                org = await ctx.scopedPrisma.organization.create({
                    data: {
                        name: "My Organization",
                        slug: `my-org-${Date.now()}`,
                        primaryColor: "#2563EB",
                        secondaryColor: "#0F172A",
                        accentColor: "#F59E0B",
                    },
                });
            }
        }

        return ok(org);
    }
);

const protectedPatch = withTenantProtection(
    {
        route: "/api/settings",
        roles: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
        rateLimit: { keyPrefix: "settings-write", max: 40, windowMs: 60_000 },
    },
    async (req, ctx) => {
        if (ctx.sessionUser.role === "WORKER") {
            return fail("FORBIDDEN", "Forbidden", 403);
        }

        const body = await parseJsonBody(req, patchSchema);

        let orgId = ctx.orgId;
        if (!orgId) {
            const org = await ctx.scopedPrisma.organization.findFirst();
            if (org) orgId = org.id;
        }

        if (!orgId) {
            return fail("NOT_FOUND", "No Organization Found", 404);
        }

        const updated = await ctx.scopedPrisma.organization.update({
            where: { id: orgId },
            data: {
                ...(body.primaryColor && { primaryColor: body.primaryColor }),
                ...(body.secondaryColor && { secondaryColor: body.secondaryColor }),
                ...(body.accentColor && { accentColor: body.accentColor }),
                ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl }),
                ...(body.name && { name: body.name }),
            },
        });

        return ok(updated);
    }
);

export async function GET(req: Request) {
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
    return withApiErrorHandling(req, "/api/settings", requestId, () => protectedGet(req));
}

export async function PATCH(req: Request) {
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
    return withApiErrorHandling(req, "/api/settings", requestId, () => protectedPatch(req));
}
