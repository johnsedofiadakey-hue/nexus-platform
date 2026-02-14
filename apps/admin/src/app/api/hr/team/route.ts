import { z } from "zod";
import bcrypt from "bcryptjs";
import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { ok, fail } from "@/lib/platform/api-response";
import { parseJsonBody, parseQuery } from "@/lib/platform/validation";

export const dynamic = "force-dynamic";

const createTeamMemberSchema = z
  .object({
    name: z.string().min(1).max(120),
    email: z.string().email(),
    password: z.string().min(8).max(128),
    role: z.enum(["ADMIN", "ASSISTANT", "AUDITOR"]).optional(),
  })
  .strip();

const deleteQuerySchema = z.object({ id: z.string().min(1) }).strip();

const protectedGet = withTenantProtection(
  {
    route: "/api/hr/team",
    roles: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
    rateLimit: { keyPrefix: "hr-team-read", max: 80, windowMs: 60_000 },
  },
  async (_req, ctx) => {
    const users = await ctx.scopedPrisma.user.findMany({
      where: { role: { in: ["ADMIN", "ASSISTANT", "AUDITOR"] } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastSeen: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(users);
  }
);

const protectedPost = withTenantProtection(
  {
    route: "/api/hr/team",
    roles: ["ADMIN", "SUPER_ADMIN"],
    rateLimit: { keyPrefix: "hr-team-write", max: 25, windowMs: 60_000 },
  },
  async (req, ctx) => {
    const body = await parseJsonBody(req, createTeamMemberSchema);
    const normalizedEmail = body.email.toLowerCase();

    const exists = await ctx.scopedPrisma.user.findUnique({ where: { email: normalizedEmail } });
    if (exists) {
      return fail("EMAIL_IN_USE", "Email already in use", 400);
    }

    const hashedPassword = await bcrypt.hash(body.password, 12);

    const newUser = await ctx.scopedPrisma.user.create({
      data: {
        name: body.name,
        email: normalizedEmail,
        password: hashedPassword,
        role: body.role || "ASSISTANT",
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    return ok(newUser, 201);
  }
);

const protectedDelete = withTenantProtection(
  {
    route: "/api/hr/team",
    roles: ["ADMIN", "SUPER_ADMIN"],
    rateLimit: { keyPrefix: "hr-team-delete", max: 20, windowMs: 60_000 },
  },
  async (req, ctx) => {
    const query = parseQuery(new URL(req.url), deleteQuerySchema);

    const target = await ctx.scopedPrisma.user.findUnique({
      where: { id: query.id },
      select: { id: true, role: true },
    });

    if (!target) {
      return fail("USER_NOT_FOUND", "Team member not found", 404);
    }

    if (target.role === "SUPER_ADMIN") {
      return fail("FORBIDDEN", "Cannot delete the owner", 403);
    }

    await ctx.scopedPrisma.user.delete({ where: { id: target.id } });
    return ok({ success: true });
  }
);
export async function GET(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/hr/team", requestId, () => protectedGet(req));
}

export async function POST(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/hr/team", requestId, () => protectedPost(req));
}

export async function DELETE(req: Request) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  return withApiErrorHandling(req, "/api/hr/team", requestId, () => protectedDelete(req));
}
