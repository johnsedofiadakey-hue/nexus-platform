import { z } from "zod";
import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { fail, ok } from "@/lib/platform/api-response";
import { parseJsonBody, parseQuery } from "@/lib/platform/validation";
import { enqueueJob } from "@/lib/platform/queue";
import { bootstrapPlatformQueue } from "@/lib/platform/bootstrap";

export const dynamic = "force-dynamic";

const querySchema = z
  .object({
    userId: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(100),
  })
  .strip();

const sendSchema = z
  .object({
    content: z.string().min(1).max(3000),
    receiverId: z.string().optional(),
  })
  .strip();

const protectedGet = withTenantProtection(
  {
    route: "/api/mobile/messages",
    roles: ["WORKER", "AGENT", "ASSISTANT", "MANAGER", "ADMIN", "SUPER_ADMIN"],
    rateLimit: { keyPrefix: "user-mobile-messages-read", max: 90, windowMs: 60_000 },
  },
  async (req, ctx) => {
    const query = parseQuery(new URL(req.url), querySchema);

    const privileged = ["MANAGER", "ADMIN", "SUPER_ADMIN"].includes(ctx.sessionUser.role);
    const viewUserId = query.userId && privileged ? query.userId : ctx.sessionUser.id;

    const skip = (query.page - 1) * query.limit;

    const [total, messages] = await Promise.all([
      ctx.scopedPrisma.message.count({
        where: {
          OR: [{ senderId: viewUserId }, { receiverId: viewUserId }],
        },
      }),
      ctx.scopedPrisma.message.findMany({
        where: {
          OR: [{ senderId: viewUserId }, { receiverId: viewUserId }],
        },
        orderBy: { createdAt: "asc" },
        take: query.limit,
        skip,
        include: {
          sender: { select: { name: true, role: true, image: true } },
          receiver: { select: { name: true, role: true, image: true } },
        },
      }),
    ]);

    return ok({
      items: messages.map((m) => ({
        id: m.id,
        content: m.content,
        isRead: m.isRead,
        createdAt: m.createdAt,
        senderId: m.senderId,
        receiverId: m.receiverId,
        senderName: m.sender?.name || "Unknown",
        receiverName: m.receiver?.name || "Unknown",
        direction: m.senderId === viewUserId ? "OUTGOING" : "INCOMING",
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  }
);

const protectedPost = withTenantProtection(
  {
    route: "/api/mobile/messages",
    roles: ["WORKER", "AGENT", "ASSISTANT", "MANAGER", "ADMIN", "SUPER_ADMIN"],
    rateLimit: { keyPrefix: "user-mobile-messages-write", max: 30, windowMs: 60_000 },
  },
  async (req, ctx) => {
    bootstrapPlatformQueue();
    const body = await parseJsonBody(req, sendSchema);

    let receiverId = body.receiverId;

    if (!receiverId) {
      const manager = ctx.sessionUser.shopId
        ? await ctx.scopedPrisma.user.findFirst({
            where: { shopId: ctx.sessionUser.shopId, role: "MANAGER", status: "ACTIVE" },
            select: { id: true },
          })
        : null;

      if (manager?.id) {
        receiverId = manager.id;
      }
    }

    if (!receiverId) {
      const admin = await ctx.scopedPrisma.user.findFirst({
        where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE" },
        select: { id: true },
      });
      receiverId = admin?.id;
    }

    if (!receiverId) {
      return fail("NO_RECEIVER", "No support recipient available", 503);
    }

    const message = await ctx.scopedPrisma.message.create({
      data: {
        content: body.content,
        senderId: ctx.sessionUser.id,
        receiverId,
        isRead: false,
      },
      select: { id: true, content: true, senderId: true, receiverId: true, createdAt: true, isRead: true },
    });

    if (ctx.orgId) {
      enqueueJob("notification", {
        organizationId: ctx.orgId,
        type: "MESSAGE",
        title: "New Field Message",
        message: `${ctx.sessionUser.email}: ${body.content.slice(0, 40)}${body.content.length > 40 ? "..." : ""}`,
        link: "/dashboard/messages",
      });
    }

    return ok(message, 201);
  }
);

export async function GET(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/mobile/messages", requestId, () => protectedGet(req));
}

export async function POST(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/mobile/messages", requestId, () => protectedPost(req));
}
