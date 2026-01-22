import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// --- HAVERSINE DISTANCE CALCULATOR (METERS) ---
// Physically written in-line to ensure atomic execution
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staffId = (await params).id;

    // 1. Fetch User and Assigned Shop Coordinates
    const user = await prisma.user.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        name: true,
        lastLat: true,
        lastLng: true,
        lastSync: true,
        role: true,
        phone: true,
        email: true,
        ghanaCardId: true,
        status: true,
        monthlyTargetRev: true,
        monthlyTargetVol: true,
        shop: {
          select: {
            id: true,
            latitude: true,
            longitude: true,
            radius: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Staff identity missing from registry" }, { status: 404 });
    }

    // 2. Perform Geofence Calculation
    let isInsideZone = true; // Default safe
    let distance = 0;

    // Only calculate if we have valid coordinates for both User and Shop
    if (user.lastLat && user.lastLng && user.shop?.latitude && user.shop?.longitude) {
      distance = calculateDistance(
        user.lastLat,
        user.lastLng,
        user.shop.latitude,
        user.shop.longitude
      );

      // Check against shop radius (default 500m if not set)
      const allowedRadius = user.shop.radius || 500;
      isInsideZone = distance <= allowedRadius;
    }

    // 3. Construct Telemetry Payload
    return NextResponse.json({
      id: user.id,
      name: user.name,
      lastLat: user.lastLat,
      lastLng: user.lastLng,
      lastSync: user.lastSync,
      isInsideZone: isInsideZone,
      distanceFromHub: Math.round(distance),
      assignedShopId: user.shop?.id || null,
      
      // Pass-through profile data to keep UI synced
      role: user.role,
      phone: user.phone,
      email: user.email,
      ghanaCardId: user.ghanaCardId,
      status: user.status,
      monthlyTargetRev: user.monthlyTargetRev,
      monthlyTargetVol: user.monthlyTargetVol,
      
      // Success Flag
      success: true
    });

  } catch (error: any) {
    console.error("Telemetry Endpoint Failure:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Satellite link interrupted" 
    }, { status: 500 });
  }
}