import { z } from "zod";
import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { ok, fail } from "@/lib/platform/api-response";
import { parseJsonBody, parseQuery } from "@/lib/platform/validation";

export const dynamic = "force-dynamic";

const querySchema = z.object({ userId: z.string().min(1) }).strip();
const sendSchema = z
  .object({
    receiverId: z.string().min(1),
    content: z.string().min(1).max(3000),
  })
  .strip();

const protectedGet = withTenantProtection(
  {
    route: "/api/messages",
    roles: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
    rateLimit: { keyPrefix: "user-messages-read", max: 90, windowMs: 60_000 },
  },
  async (req, ctx) => {
    const query = parseQuery(new URL(req.url), querySchema);

    const orgAdmins = await ctx.scopedPrisma.user.findMany({
      where: {
        role: { in: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
      },
      select: { id: true },
    });

    const adminIds = orgAdmins.map((admin) => admin.id);

    const messages = await ctx.scopedPrisma.message.findMany({
      where: {
        OR: [
          { senderId: query.userId, receiverId: { in: adminIds } },
          { senderId: { in: adminIds }, receiverId: query.userId },
        ],
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        content: true,
        isRead: true,
        createdAt: true,
        senderId: true,
        receiverId: true,
        sender: { select: { name: true, role: true, image: true } },
      },
      take: 100,
    });

    await ctx.scopedPrisma.message.updateMany({
      where: {
        senderId: query.userId,
        receiverId: { in: adminIds },
        isRead: false,
      },
      data: { isRead: true },
    });

    return ok(messages);
  }
);

const protectedPost = withTenantProtection(
  {
    route: "/api/messages",
    roles: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
    rateLimit: { keyPrefix: "user-messages-write", max: 35, windowMs: 60_000 },
  },
  async (req, ctx) => {
    const body = await parseJsonBody(req, sendSchema);

    const receiver = await ctx.scopedPrisma.user.findUnique({
      where: { id: body.receiverId },
      select: { id: true },
    });

    if (!receiver) {
      return fail("RECEIVER_NOT_FOUND", "Receiver not found", 404);
    }

    const message = await ctx.scopedPrisma.message.create({
      data: {
        senderId: ctx.sessionUser.id,
        receiverId: body.receiverId,
        content: body.content,
      },
      select: {
        id: true,
        content: true,
        isRead: true,
        createdAt: true,
        senderId: true,
        receiverId: true,
      },
    });

    return ok(message, 201);
  }
);

export async function GET(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/messages", requestId, () => protectedGet(req));
}

export async function POST(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/messages", requestId, () => protectedPost(req));
}
