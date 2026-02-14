import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { ok } from "@/lib/platform/api-response";

export const dynamic = "force-dynamic";

const protectedGet = withTenantProtection(
    {
        route: "/api/super/tenants",
        roles: ["SUPER_ADMIN"],
        rateLimit: { keyPrefix: "super-tenants-read", max: 60, windowMs: 60_000 },
    },
    async (_req, ctx) => {
        const organizations = await ctx.scopedPrisma.organization.findMany({
            include: { _count: { select: { shops: true, users: true } } },
            orderBy: { createdAt: "desc" },
        });

        const tenants = organizations.map((organization) => ({
            id: organization.id,
            name: organization.name,
            status: organization.status,
            users: organization._count.users,
            shops: organization._count.shops,
            plan: organization.plan,
        }));

        return ok(tenants);
    }
);

export async function GET(req: Request) {
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
    return withApiErrorHandling(req, "/api/super/tenants", requestId, () => protectedGet(req));
}
