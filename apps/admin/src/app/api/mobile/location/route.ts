import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDistance } from "@/lib/utils";
import { requireAuth } from "@/lib/auth-helpers";

/**
 * 🛰️ GEOFENCE ENGINE - PRODUCTION GRADE
 * Calculates real-world distance between coordinates in meters.
 * Features GPS accuracy validation and safety buffers.
 */

const GPS_ACCURACY_THRESHOLD = 50; // Only trust GPS with ≤50m accuracy
const SAFETY_BUFFER = 30; // Add 30m buffer to geofence radius

export async function POST(req: Request) {
  try {
    // 🔐 Require authentication
    const authenticatedUser = await requireAuth();
    
    const { userId, lat, lng, accuracy } = await req.json();

    // Verify the authenticated user matches the userId or has permission
    if (authenticatedUser.id !== userId && authenticatedUser.role !== 'ADMIN' && authenticatedUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({
        error: "Unauthorized: Cannot update location for different user"
      }, { status: 403 });
    }

    // 1. Authenticate Identity & Assigned Hub
    const agent = await prisma.user.findUnique({
      where: { id: userId },
      include: { shop: true }
    });

    if (!agent || !agent.shop) {
      return NextResponse.json({
        authorized: false,
        error: "Access Denied: No hub link found"
      }, { status: 404 });
    }

    // 2. Compute Precision Distance
    const distance = calculateDistance(
      lat, lng,
      agent.shop.latitude,
      agent.shop.longitude
    );

    // 🛡️ Apply safety buffer to account for GPS inaccuracy
    const baseRadius = agent.shop.radius || 200;
    const effectiveRadius = baseRadius + SAFETY_BUFFER;
    const isInside = distance <= effectiveRadius || agent.bypassGeofence;

    // 🚫 Only log breaches if GPS accuracy is reliable
    const isGpsReliable = !accuracy || accuracy <= GPS_ACCURACY_THRESHOLD;

    // 3. 🛡️ AUTOMATED COMPLIANCE LOGGER
    // Only log if:
    // - GPS accuracy is good (prevents false positives)
    // - Significantly outside zone (beyond safety buffer + threshold)
    // - User doesn't have bypass permission
    if (!isInside && isGpsReliable && !agent.bypassGeofence && distance > (effectiveRadius + 100)) {
      await prisma.disciplinaryRecord.create({
        data: {
          userId: userId,
          type: 'GEOFENCE_BREACH',
          severity: distance > (effectiveRadius + 500) ? 'CRITICAL' : 'WARNING',
          description: `Geofence breach: Agent was ${Math.round(distance - baseRadius)}m outside perimeter (GPS accuracy: ${accuracy ? `±${Math.round(accuracy)}m` : 'unknown'}). GPS: ${lat}, ${lng}`,
          actionTaken: 'SYSTEM_AUTO_LOG'
        }
      });
    }

    // 4. Synchronize Live State for HQ Map
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLat: lat,
        lastLng: lng,
        status: agent.status
      }
    });

    return NextResponse.json({
      authorized: isInside,
      distance: Math.round(distance),
      boundary: baseRadius,
      effectiveRadius: effectiveRadius,
      gpsAccuracy: accuracy ? Math.round(accuracy) : null,
      identity: agent.name,
      hub: agent.shop.name,
      message: isInside
        ? "Within Authorized Hub Zone"
        : `Outside zone: ${Math.round(distance - baseRadius)}m beyond perimeter`
    });
  } catch (error: any) {
    console.error("GEOFENCE_CRASH:", error.message);
    return NextResponse.json({ error: "Satellite link failed" }, { status: 500 });
  }
}
