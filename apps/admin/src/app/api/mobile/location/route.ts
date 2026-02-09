import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for API routes that use database
export const dynamic = 'force-dynamic';
import { calculateDistance } from "@/lib/utils";
import { requireAuth } from "@/lib/auth-helpers";

/**
 * 🛰️ GEOFENCE ENGINE - PRODUCTION GRADE
 * Calculates real-world distance between coordinates in meters.
 * Features GPS accuracy validation and safety buffers.
 */

// ✅ TUNED GPS ACCURACY THRESHOLDS
const GPS_ACCURACY_EXCELLENT = 10; // ≤10m - Highest accuracy (GPS with clear sky)
const GPS_ACCURACY_GOOD = 30;      // ≤30m - Good accuracy (typical urban GPS)
const GPS_ACCURACY_FAIR = 50;      // ≤50m - Fair accuracy (buildings/obstacles)
const GPS_ACCURACY_POOR = 100;     // >100m - Poor accuracy (unreliable)

// Only trust GPS readings with accuracy ≤50m
const GPS_ACCURACY_THRESHOLD = GPS_ACCURACY_FAIR;

// ✅ ENHANCED SAFETY BUFFER based on accuracy
const SAFETY_BUFFER_EXCELLENT = 15;  // 15m for excellent accuracy
const SAFETY_BUFFER_GOOD = 30;       // 30m for good accuracy
const SAFETY_BUFFER_FAIR = 50;       // 50m for fair accuracy
const SAFETY_BUFFER_POOR = 100;      // Reject if accuracy too poor

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

    // 🛡️ Determine safety buffer based on GPS accuracy
    let safetyBuffer = SAFETY_BUFFER_FAIR;
    let isGpsReliable = true;

    if (accuracy !== undefined) {
      if (accuracy <= GPS_ACCURACY_EXCELLENT) {
        safetyBuffer = SAFETY_BUFFER_EXCELLENT;
      } else if (accuracy <= GPS_ACCURACY_GOOD) {
        safetyBuffer = SAFETY_BUFFER_GOOD;
      } else if (accuracy <= GPS_ACCURACY_FAIR) {
        safetyBuffer = SAFETY_BUFFER_FAIR;
      } else if (accuracy > GPS_ACCURACY_POOR) {
        // GPS accuracy too poor - don't trust this reading
        isGpsReliable = false;
      }
    }

    // ✅ Calculate effective radius with dynamic safety buffer
    const baseRadius = agent.shop.radius || 200;
    const effectiveRadius = baseRadius + safetyBuffer;

    // ✅ FIXED: Only bypass for SUPER_ADMIN with explicit authorization, not for regular admins
    const canBypassGeofence = agent.bypassGeofence && authenticatedUser.role === 'SUPER_ADMIN';
    const isInside = distance <= effectiveRadius || canBypassGeofence;

    // 3. 🛡️ AUTOMATED COMPLIANCE LOGGER
    // Only log if:
    // - GPS accuracy is reliable (prevents false positives)
    // - User is outside zone and can't bypass
    // - Distance is significantly beyond safety buffer
    if (!isInside && isGpsReliable && !canBypassGeofence && distance > (effectiveRadius + 50)) {
      // Determine severity based on distance
      let severity = 'WARNING';
      if (distance > (effectiveRadius + 500)) {
        severity = 'CRITICAL';
      } else if (distance > (effectiveRadius + 200)) {
        severity = 'HIGH';
      }

      await prisma.disciplinaryRecord.create({
        data: {
          userId: userId,
          type: 'GEOFENCE_BREACH',
          severity: severity,
          description: `Geofence breach: Agent ${Math.round(distance - baseRadius)}m outside perimeter. Zone: ${agent.shop.name}. GPS accuracy: ${accuracy ? `±${Math.round(accuracy)}m` : 'unknown'}. Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          actionTaken: 'SYSTEM_AUTO_LOG'
        }
      });

      // ✅ Log bypass usage by SUPER_ADMIN for audit
      if (canBypassGeofence) {
        await prisma.auditLog.create({
          data: {
            userId: authenticatedUser.id,
            action: 'GEOFENCE_BYPASS_USED',
            entity: 'User',
            entityId: userId,
            details: JSON.stringify({
              actualDistance: Math.round(distance),
              allowedDistance: effectiveRadius,
              zone: agent.shop.name,
              timestamp: new Date().toISOString()
            })
          }
        });
      }
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
