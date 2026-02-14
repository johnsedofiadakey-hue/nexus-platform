import { z } from "zod";
import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { fail, ok } from "@/lib/platform/api-response";
import { parseJsonBody } from "@/lib/platform/validation";
import { enqueueJob } from "@/lib/platform/queue";
import { bootstrapPlatformQueue } from "@/lib/platform/bootstrap";

export const dynamic = "force-dynamic";

const pulseSchema = z
  .object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    accuracy: z.number().nonnegative().max(1000).optional(),
  })
  .strip();

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const protectedPost = withTenantProtection(
  {
    route: "/api/mobile/pulse",
    roles: ["WORKER", "AGENT", "ASSISTANT", "MANAGER", "ADMIN", "SUPER_ADMIN"],
    rateLimit: { keyPrefix: "user-mobile-pulse", max: 45, windowMs: 60_000 },
  },
  async (req, ctx) => {
    bootstrapPlatformQueue();

    const body = await parseJsonBody(req, pulseSchema);

    const agent = await ctx.scopedPrisma.user.findUnique({
      where: { id: ctx.sessionUser.id },
      select: {
        id: true,
        isInsideZone: true,
        bypassGeofence: true,
        shop: {
          select: { id: true, latitude: true, longitude: true, radius: true },
        },
      },
    });

    if (!agent) {
      return fail("AGENT_NOT_FOUND", "Agent not found", 404);
    }

    let isInside = true;
    let breachDistance = 0;

    if (agent.shop && !agent.bypassGeofence) {
      const targetLat = Number(agent.shop.latitude ?? 0);
      const targetLng = Number(agent.shop.longitude ?? 0);
      const radius = Number(agent.shop.radius ?? 200);
      const dist = distanceMeters(body.lat, body.lng, targetLat, targetLng);
      breachDistance = Math.round(dist);
      isInside = dist <= radius;
    }

    const previousInside = Boolean(agent.isInsideZone);

    await ctx.scopedPrisma.user.update({
      where: { id: agent.id },
      data: {
        lastLat: body.lat,
        lastLng: body.lng,
        lastSeen: new Date(),
        isInsideZone: isInside,
        status: "ACTIVE",
      },
    });

    const gpsReliable = body.accuracy === undefined || body.accuracy <= 50;
    const transitionedOut = previousInside && !isInside;

    if (transitionedOut && gpsReliable) {
      enqueueJob("activity-log", {
        userId: agent.id,
        userName: ctx.sessionUser.email,
        userRole: ctx.sessionUser.role,
        action: "GEOFENCE_EXIT",
        entity: "User",
        entityId: agent.id,
        description: `Geofence exit detected (${breachDistance}m)` ,
        metadata: {
          breachDistance,
          accuracy: body.accuracy,
          previousInside,
          isInside,
        },
        ipAddress: ctx.ip,
        shopId: agent.shop?.id,
      });
    }

    if (!previousInside && isInside) {
      enqueueJob("activity-log", {
        userId: agent.id,
        userName: ctx.sessionUser.email,
        userRole: ctx.sessionUser.role,
        action: "GEOFENCE_REENTRY",
        entity: "User",
        entityId: agent.id,
        description: "Geofence re-entry detected",
        metadata: { previousInside, isInside, accuracy: body.accuracy },
        ipAddress: ctx.ip,
        shopId: agent.shop?.id,
      });
    }

    return ok({ isInside, transitioned: previousInside !== isInside });
  }
);

export async function POST(req: Request) {
  return withApiErrorHandling(req, "/api/mobile/pulse", req.headers.get("x-request-id") || crypto.randomUUID(), () =>
    protectedPost(req)
  );
}
