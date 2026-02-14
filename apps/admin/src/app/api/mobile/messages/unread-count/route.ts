import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { ok } from "@/lib/platform/api-response";

export const dynamic = "force-dynamic";

const protectedGet = withTenantProtection(
  {
    route: "/api/mobile/messages/unread-count",
    roles: ["WORKER", "ASSISTANT", "AGENT", "MANAGER", "ADMIN", "SUPER_ADMIN"],
    rateLimit: { keyPrefix: "mobile-unread-read", max: 180, windowMs: 60_000 },
  },
  async (_req, ctx) => {
    const count = await ctx.scopedPrisma.message.count({
      where: {
        receiverId: ctx.sessionUser.id,
        isRead: false,
      },
    });

    return ok({ count });
  }
);

export async function GET(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  try {
    return await withApiErrorHandling(req, "/api/mobile/messages/unread-count", requestId, () => protectedGet(req));
  } catch {
    return ok({ count: 0 });
  }
}