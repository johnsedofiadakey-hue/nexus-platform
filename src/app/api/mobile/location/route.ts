import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * 🛰️ GEOFENCE ENGINE
 * Calculates real-world distance between coordinates in meters.
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth's radius
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; 
}

export async function POST(req: Request) {
  try {
    const { userId, lat, lng } = await req.json();

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
      parseFloat(agent.shop.latitude), 
      parseFloat(agent.shop.longitude)
    );

    const radius = parseFloat(agent.shop.radius) || 200;
    const isInside = distance <= radius;

    // 3. 🛡️ AUTOMATED COMPLIANCE LOGGER
    // If a breach is detected, we file a permanent record before responding
    if (!isInside) {
      await prisma.complianceLog.create({
        data: {
          userId: userId,
          shopId: agent.shop.id,
          type: 'GEOFENCE_BREACH',
          // Severity scales based on how far they've drifted
          severity: distance > (radius + 500) ? 'CRITICAL' : 'WARNING',
          details: `Geofence breach: Agent was ${Math.round(distance - radius)}m outside perimeter.`,
          lat: lat.toString(),
          lng: lng.toString()
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
      boundary: radius,
      identity: agent.name,
      hub: agent.shop.name,
      message: isInside 
        ? "Within Authorized Hub Zone" 
        : `Breach Logged: ${Math.round(distance - radius)}m outside perimeter`
    });
  } catch (error: any) {
    console.error("GEOFENCE_CRASH:", error.message);
    return NextResponse.json({ error: "Satellite link failed" }, { status: 500 });
  }
}