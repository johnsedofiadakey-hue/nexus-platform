import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/sessionUser";

// Optimization: Haversine distance helper
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { lat, lng } = await req.json();
    const sessionUser = await resolveSessionUser(session);
    if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = sessionUser.id;

    // 🏎️ PERFORMANCE: Fetching basic info to verify geofence
    // NOTE: Removed isInsideZone from select temporarily to stop the 500 crash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        lastLat: true,
        lastLng: true,
        shop: {
          select: { id: true, latitude: true, longitude: true, radius: true }
        }
      }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 1. Concurrent Update: Track basic movement
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLat: lat,
        lastLng: lng,
        lastSync: new Date()
      }
    });

    // 2. Geofence Logic: Only log if we have shop coordinates
    if (user.shop?.latitude && user.shop?.longitude) {
      const distance = getDistance(lat, lng, user.shop.latitude, user.shop.longitude);
      const radius = user.shop.radius || 150;
      const isCurrentlyInside = distance <= radius;

      // Determine if a breach event occurred by comparing with previous coordinates
      const wasPreviouslyInside = user.lastLat ? 
        getDistance(user.lastLat, user.lastLng || 0, user.shop.latitude, user.shop.longitude) <= radius : true;

      if (isCurrentlyInside !== wasPreviouslyInside) {
        await prisma.geofenceEvent.create({
          data: {
            userId,
            shopId: user.shop.id,
            type: isCurrentlyInside ? "ENTER" : "EXIT",
            lat,
            lng
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Critical Telemetry Failure:", error);
    return NextResponse.json({ error: "System Congestion" }, { status: 500 });
  }
}