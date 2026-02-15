import { z } from "zod";
import bcrypt from "bcryptjs";
import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { fail, ok } from "@/lib/platform/api-response";
import { parseJsonBody, parseQuery } from "@/lib/platform/validation";
import { logActivity } from "@/lib/activity-logger";
import { resolveStrictStatus } from "@/lib/attendance/strict-status";

export const dynamic = "force-dynamic";

const querySchema = z
  .object({
    light: z
      .union([z.literal("true"), z.literal("false")])
      .optional()
      .transform((value) => value === "true"),
  })
  .strip();

const patchSchema = z
  .object({
    action: z.enum(["UPDATE_PROFILE", "RESET_PASSWORD", "MANAGE_LEAVE"]),
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    status: z.string().optional(),
    shopId: z.string().nullable().optional(),
    bypassGeofence: z.boolean().optional(),
    bankName: z.string().nullable().optional(),
    bankAccountNumber: z.string().nullable().optional(),
    bankAccountName: z.string().nullable().optional(),
    ssnitNumber: z.string().nullable().optional(),
    commencementDate: z.string().nullable().optional(),
    password: z.string().optional(),
    leaveId: z.string().optional(),
  })
  .strip();

type UserTimeline = { createdAt: Date; [key: string]: unknown };

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  return withApiErrorHandling(req, "/api/hr/member/[id]", requestId, async () => {
    const { id } = await props.params;

    const protectedGet = withTenantProtection(
      {
        route: "/api/hr/member/[id]",
        roles: ["MANAGER", "ADMIN", "SUPER_ADMIN", "AUDITOR"],
        rateLimit: { keyPrefix: "hr-member-read", max: 80, windowMs: 60_000 },
      },
      async (_request, ctx) => {
        if (!id) {
          return fail("VALIDATION_ERROR", "Missing ID", 400);
        }

        const light = parseQuery(new URL(req.url), querySchema).light;
        const whereClause: any = { id };
        if (ctx.sessionUser.role !== "SUPER_ADMIN" && ctx.orgId) {
          whereClause.organizationId = ctx.orgId;
        }

        const include: any = {
          shop: {
            select: {
              id: true,
              name: true,
              location: true,
              latitude: true,
              longitude: true,
              radius: true,
            },
          },
          targets: { where: { status: "ACTIVE" }, orderBy: { endDate: "desc" } },
        };

        if (!light) {
          include.sales = { take: 20, orderBy: { createdAt: "desc" } };
          include.dailyReports = { take: 50, orderBy: { createdAt: "desc" } };
          include.attendance = { take: 30, orderBy: { date: "desc" } };
          include.leaves = { take: 50, orderBy: { createdAt: "desc" } };
          include.disciplinary = { take: 30, orderBy: { createdAt: "desc" } };
          include.sentMessages = { take: 20, orderBy: { createdAt: "desc" } };
          include.receivedMessages = { take: 20, orderBy: { createdAt: "desc" } };
        } else {
          include.disciplinary = { take: 30, orderBy: { createdAt: "desc" } };
        }

        const queryPromise = ctx.scopedPrisma.user.findFirst({ where: whereClause, include });
        const timeoutPromise = new Promise<never>((_resolve, reject) => {
          setTimeout(() => reject(new Error("Database query timeout")), 10_000);
        });

        const user = (await Promise.race([queryPromise, timeoutPromise])) as any;
        if (!user) {
          return fail("NOT_FOUND", `No agent found with ID: ${id}. Check if this person exists in your organization.`, 404);
        }

        const disciplinaryLog = user.disciplinary || [];
        const chatHistory = [...(user.sentMessages || []), ...(user.receivedMessages || [])].sort(
          (a: UserTimeline, b: UserTimeline) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        const geofenceStats = disciplinaryLog
          .filter((log: any) => log.type === "GEOFENCE_BREACH")
          .reduce((acc: Array<{ name: string; breaches: number }>, log: any) => {
            const logDate = log.createdAt || new Date();
            const day = new Date(logDate).toLocaleDateString("en-US", { weekday: "short" });
            const existing = acc.find((entry) => entry.name === day);
            if (existing) {
              existing.breaches += 1;
            } else {
              acc.push({ name: day, breaches: 1 });
            }
            return acc;
          }, []);

        return ok({
          ...user,
          strictAttendanceStatus: resolveStrictStatus(Boolean(user.isInsideZone), user.lastSeen, new Date()),
          disciplinaryLog,
          messages: chatHistory,
          geofenceStats,
          viewerId: ctx.sessionUser.id,
          targets: user.targets || [],
        });
      }
    );

    return protectedGet(req);
  });
}

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  return withApiErrorHandling(req, "/api/hr/member/[id]", requestId, async () => {
    const { id } = await props.params;

    const protectedPatch = withTenantProtection(
      {
        route: "/api/hr/member/[id]",
        roles: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
        rateLimit: { keyPrefix: "hr-member-write", max: 40, windowMs: 60_000 },
      },
      async (_request, ctx) => {
        const body = await parseJsonBody(req, patchSchema);
        const { action, ...payload } = body;

        const whereCheck: any = { id };
        if (ctx.sessionUser.role !== "SUPER_ADMIN" && ctx.orgId) {
          whereCheck.organizationId = ctx.orgId;
        }

        const targetUser = await ctx.scopedPrisma.user.findFirst({ where: whereCheck });
        if (!targetUser) {
          return fail("FORBIDDEN", "Access Denied", 403);
        }

        if (action === "UPDATE_PROFILE") {
          const updateData: any = {
            name: payload.name,
            email: payload.email?.toLowerCase().trim(),
            phone: payload.phone,
            status: payload.status,
            shopId: payload.shopId || null,
            bypassGeofence: payload.bypassGeofence,
            bankName: payload.bankName || null,
            bankAccountNumber: payload.bankAccountNumber || null,
            bankAccountName: payload.bankAccountName || null,
            ssnitNumber: payload.ssnitNumber || null,
          };

          if (payload.shopId && payload.shopId !== targetUser.shopId) {
            const newShop = await ctx.scopedPrisma.shop.findUnique({
              where: { id: payload.shopId },
              select: { organizationId: true },
            });
            if (newShop) {
              updateData.organizationId = newShop.organizationId;
            }
          }

          if (payload.commencementDate) {
            const parsedDate = new Date(payload.commencementDate);
            if (!Number.isNaN(parsedDate.getTime())) {
              updateData.commencementDate = parsedDate;
            }
          } else {
            updateData.commencementDate = null;
          }

          if (payload.password && payload.password.length > 0) {
            updateData.password = await bcrypt.hash(payload.password, 12);
          }

          const updated = await ctx.scopedPrisma.user.update({
            where: { id },
            data: updateData,
          });

          await logActivity({
            userId: ctx.sessionUser.id,
            userName: ctx.sessionUser.email,
            userRole: ctx.sessionUser.role,
            action: "USER_UPDATED",
            entity: "User",
            entityId: id,
            description: `Updated profile for "${updated.name}"`,
            metadata: { targetUserId: id, changes: payload },
            ipAddress: ctx.ip,
          });

          return ok({ data: updated });
        }

        if (action === "RESET_PASSWORD") {
          if (!payload.password) {
            return fail("VALIDATION_ERROR", "Password required", 400);
          }

          const hashedPassword = await bcrypt.hash(payload.password, 12);
          await ctx.scopedPrisma.user.update({
            where: { id },
            data: { password: hashedPassword },
          });
          return ok({ success: true });
        }

        if (action === "MANAGE_LEAVE") {
          if (!payload.leaveId || !payload.status) {
            return fail("VALIDATION_ERROR", "leaveId and status are required", 400);
          }

          await ctx.scopedPrisma.leaveRequest.update({
            where: { id: payload.leaveId },
            data: { status: payload.status },
          });
          return ok({ success: true });
        }

        return fail("VALIDATION_ERROR", "Action protocol undefined", 400);
      }
    );

    return protectedPatch(req);
  });
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  return withApiErrorHandling(req, "/api/hr/member/[id]", requestId, async () => {
    const { id } = await props.params;

    const protectedDelete = withTenantProtection(
      {
        route: "/api/hr/member/[id]",
        roles: ["ADMIN", "SUPER_ADMIN"],
        rateLimit: { keyPrefix: "hr-member-delete", max: 20, windowMs: 60_000 },
      },
      async (_request, ctx) => {
        const whereCheck: any = { id };
        if (ctx.sessionUser.role !== "SUPER_ADMIN" && ctx.orgId) {
          whereCheck.organizationId = ctx.orgId;
        }

        const targetUser = await ctx.scopedPrisma.user.findFirst({ where: whereCheck });
        if (!targetUser) {
          return fail("FORBIDDEN", "Access Denied", 403);
        }

        await ctx.scopedPrisma.user.delete({ where: { id } });

        await logActivity({
          userId: ctx.sessionUser.id,
          userName: ctx.sessionUser.email,
          userRole: ctx.sessionUser.role,
          action: "USER_DELETED",
          entity: "User",
          entityId: id,
          description: `Deleted user "${targetUser.name}"`,
          metadata: { deletedUserId: id, deletedUserName: targetUser.name, deletedUserEmail: targetUser.email },
          ipAddress: ctx.ip,
        });

        return ok({ success: true });
      }
    );

    return protectedDelete(req);
  });
}