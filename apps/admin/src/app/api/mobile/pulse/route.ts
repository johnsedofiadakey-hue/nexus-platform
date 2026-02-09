import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for API routes that use database
export const dynamic = 'force-dynamic';

// In-memory cache for agent shop data (reduces DB load)
const agentCache = new Map<string, { shop: any; userId: string; lastFetch: number }>();
const CACHE_TTL = 60000; // 1 minute

export async function POST(req: Request) {
  try {
    // 1. Verify who is sending the pulse
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse Payload
    const { lat, lng, accuracy } = await req.json();

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: "Invalid Coordinates" }, { status: 400 });
    }

    // 🛡️ GPS Accuracy Validation
    const GPS_ACCURACY_THRESHOLD = 50; // Only trust GPS with ≤50m accuracy
    const isGpsReliable = !accuracy || accuracy <= GPS_ACCURACY_THRESHOLD;

    // 3. Fetch User & Shop Context with caching
    const cacheKey = session.user.email;
    let cached = agentCache.get(cacheKey);
    const now = Date.now();
    
    if (!cached || (now - cached.lastFetch) > CACHE_TTL) {
      const agent = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          isInsideZone: true,
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
      
      if (!agent) {
        return NextResponse.json({ error: "Agent not found" }, { status: 401 });
      }
      
      cached = { shop: agent.shop, userId: agent.id, lastFetch: now };
      agentCache.set(cacheKey, cached);
    }

    const agent = { id: cached.userId, shop: cached.shop, isInsideZone: false };

    // 4. Geofence Logic
    let isInside = false;
    let shouldLogBreach = false;
    let breachDistance = 0;

    if (agent.shop) {
      const R = 6371e3; // Earth Radius
      const dLat = (agent.shop.latitude! - lat) * Math.PI / 180;
      const dLng = (agent.shop.longitude! - lng) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat * Math.PI / 180) * Math.cos(agent.shop.latitude! * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // Meters

      const radius = agent.shop.radius || 200;
      isInside = distance <= radius;

      // 5. Check if we need to log breach (but don't query isInsideZone yet)
      if (!isInside) {
        shouldLogBreach = true;
        breachDistance = Math.round(distance);
      }
    }

    // 6. Update Live State (single query)
    const updatedAgent = await prisma.user.update({
      where: { id: agent.id },
      data: {
        lastLat: lat,
        lastLng: lng,
        lastSeen: new Date(),
        isInsideZone: isInside,
        status: 'ACTIVE'
      },
      select: {
        isInsideZone: true
      }
    });
    
    // 7. Log breach only if GPS is reliable and transitioning from inside to outside
    if (shouldLogBreach && updatedAgent.isInsideZone === false && isGpsReliable) {
      // Fire and forget - don't await to speed up response
      prisma.disciplinaryRecord.create({
        data: {
          userId: agent.id,
          type: 'GEOFENCE_BREACH',
          severity: breachDistance > 500 ? 'CRITICAL' : 'WARNING',
          description: `Agent left assigned zone. Dist: ${breachDistance}m${accuracy ? ` (GPS accuracy: ±${Math.round(accuracy)}m)` : ''}`,
          actionTaken: 'SYSTEM_AUTO_LOG'
        }
      }).catch(err => console.error('Breach log failed:', err));
    }

    return NextResponse.json({ success: true, isInside });

  } catch (error) {
    console.error("Pulse Error:", error);
    return NextResponse.json({ error: "Pulse Failed" }, { status: 500 });
  }
}