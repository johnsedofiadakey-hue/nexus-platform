import { z } from "zod";
import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { fail, ok } from "@/lib/platform/api-response";
import { parseJsonBody } from "@/lib/platform/validation";
import { resolveOpenSessionEnd, resolveStrictStatus } from "@/lib/attendance/strict-status";

export const dynamic = "force-dynamic";

const bodySchema = z
    .object({
        action: z.enum(["CLOCK_IN", "CLOCK_OUT"]),
        lat: z.coerce.number(),
        lng: z.coerce.number(),
    })
    .strip();

const protectedPost = withTenantProtection(
    {
        route: "/api/mobile/attendance",
        roles: ["WORKER", "ASSISTANT", "AGENT", "MANAGER", "ADMIN", "SUPER_ADMIN"],
        rateLimit: { keyPrefix: "mobile-attendance-write", max: 60, windowMs: 60_000 },
    },
    async (req, ctx) => {
        const body = await parseJsonBody(req, bodySchema);

        const agent = await ctx.scopedPrisma.user.findUnique({
            where: { id: ctx.sessionUser.id },
            include: { shop: true },
        });

        if (!agent || !agent.shop) {
            return fail("NOT_FOUND", "Agent or Shop not found", 404);
        }

        const R = 6371e3;
        const dLat = (agent.shop.latitude! - body.lat) * Math.PI / 180;
        const dLng = (agent.shop.longitude! - body.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(body.lat * Math.PI / 180) * Math.cos(agent.shop.latitude! * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        const allowedRadius = agent.shop.radius || 100;
        const attendanceStatus = distance > allowedRadius ? "OFF_SITE" : "PRESENT";

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (body.action === "CLOCK_IN") {
            const existing = await ctx.scopedPrisma.attendance.findFirst({
                where: {
                    userId: agent.id,
                    date: { gte: today },
                },
            });

            if (existing) {
                return fail("CONFLICT", "Already clocked in today.", 409);
            }

            const record = await ctx.scopedPrisma.attendance.create({
                data: {
                    userId: agent.id,
                    checkIn: new Date(),
                    status: attendanceStatus,
                    date: new Date(),
                },
            });

            return ok({ record });
        }

        const active = await ctx.scopedPrisma.attendance.findFirst({
            where: {
                userId: agent.id,
                checkOut: null,
            },
            orderBy: { checkIn: "desc" },
        });

        if (!active) {
            return fail("NOT_FOUND", "No active shift found.", 404);
        }

        const record = await ctx.scopedPrisma.attendance.update({
            where: { id: active.id },
            data: {
                checkOut: new Date(),
            },
        });

        return ok({ record });
    }
);

const protectedGet = withTenantProtection(
    {
        route: "/api/mobile/attendance",
        roles: ["WORKER", "ASSISTANT", "AGENT", "MANAGER", "ADMIN", "SUPER_ADMIN"],
        rateLimit: { keyPrefix: "mobile-attendance-read", max: 120, windowMs: 60_000 },
    },
    async (_req, ctx) => {
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        const [user, active, todayRecords] = await Promise.all([
            ctx.scopedPrisma.user.findUnique({
                where: { id: ctx.sessionUser.id },
                select: { isInsideZone: true, lastSeen: true },
            }),
            ctx.scopedPrisma.attendance.findFirst({
                where: {
                    userId: ctx.sessionUser.id,
                    checkOut: null,
                    date: { gte: startOfToday },
                },
                orderBy: { checkIn: "desc" },
            }),
            ctx.scopedPrisma.attendance.findMany({
                where: {
                    userId: ctx.sessionUser.id,
                    date: { gte: startOfToday },
                },
                select: { checkIn: true, checkOut: true },
            }),
        ]);

        const totalOnSiteSeconds = todayRecords.reduce((total, entry) => {
            const end = entry.checkOut ?? resolveOpenSessionEnd(user?.lastSeen ?? null, now);
            const seconds = Math.max(0, Math.floor((end.getTime() - entry.checkIn.getTime()) / 1000));
            return total + seconds;
        }, 0);

        const dayElapsedSeconds = Math.max(0, Math.floor((now.getTime() - startOfToday.getTime()) / 1000));
        const totalOffSiteSeconds = Math.max(0, dayElapsedSeconds - totalOnSiteSeconds);

        const currentSessionSeconds = active
            ? Math.max(0, Math.floor((resolveOpenSessionEnd(user?.lastSeen ?? null, now).getTime() - active.checkIn.getTime()) / 1000))
            : 0;

        const strictStatus = resolveStrictStatus(Boolean(user?.isInsideZone), user?.lastSeen ?? null, now);

        return ok({
            status: strictStatus,
            hasActiveShift: Boolean(active),
            clockInTime: active?.checkIn ?? null,
            currentSessionSeconds,
            totalOnSiteSeconds,
            totalOffSiteSeconds,
            isInsideZone: Boolean(user?.isInsideZone),
            lastSeen: user?.lastSeen ?? null,
        });
    }
);

export async function POST(req: Request) {
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
    return withApiErrorHandling(req, "/api/mobile/attendance", requestId, () => protectedPost(req));
}

export async function GET(req: Request) {
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
    try {
        return await withApiErrorHandling(req, "/api/mobile/attendance", requestId, () => protectedGet(req));
    } catch {
        return ok({ status: "UNKNOWN" });
    }
}
