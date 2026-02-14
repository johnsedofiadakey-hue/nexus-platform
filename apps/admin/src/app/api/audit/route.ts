import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { ok } from "@/lib/platform/api-response";

export const dynamic = "force-dynamic";

const protectedGet = withTenantProtection(
    {
        route: "/api/audit",
        roles: ["ADMIN", "SUPER_ADMIN"],
        rateLimit: { keyPrefix: "audit-read", max: 90, windowMs: 60_000 },
    },
    async (_req, ctx) => {
        const logs = await ctx.scopedPrisma.auditLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 100,
            include: {
                user: { select: { name: true, role: true } },
            },
        });

        return ok(logs);
    }
);

export async function GET(req: Request) {
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
    return withApiErrorHandling(req, "/api/audit", requestId, () => protectedGet(req));
}
