import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // 1. Verify who is sending the pulse
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      console.log("❌ Pulse Rejected: No Session", { session });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse Payload
    const { lat, lng } = await req.json();

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: "Invalid Coordinates" }, { status: 400 });
    }

    // 3. Fetch User & Shop Context
    // Use email for resilience (Session ID might be stale after DB reset)
    const agent = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { shop: true }
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent record not found" }, { status: 401 });
    }

    // 4. Geofence Logic
    let isInside = false;

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

      // 5. Breach Logger (Transition Detection)
      if (!isInside) {
        if (agent.isInsideZone) { // Transition: Inside -> Outside
          await prisma.disciplinaryRecord.create({
            data: {
              userId: agent.id,
              type: 'GEOFENCE_BREACH',
              severity: 'WARNING',
              description: `Agent left assigned zone. Dist: ${Math.round(distance)}m`,
              actionTaken: 'SYSTEM_AUTO_LOG'
            }
          });
        }
      }
    }

    // 6. Update Live State
    await prisma.user.update({
      where: { id: agent.id },
      data: {
        lastLat: lat,
        lastLng: lng,
        lastSeen: new Date(),
        isInsideZone: isInside,
        status: 'ACTIVE'
      }
    });

    return NextResponse.json({ success: true, isInside });

  } catch (error) {
    console.error("Pulse Error:", error);
    return NextResponse.json({ error: "Pulse Failed" }, { status: 500 });
  }
}