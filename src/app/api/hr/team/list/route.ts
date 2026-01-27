import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch Everyone
    const staff = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true, // DB Status (e.g., 'SUSPENDED')
        image: true,
        phone: true,
        lastLat: true, // 📍 Need coordinates for map
        lastLng: true,
        lastSeen: true, // ⏱️ Need timestamp for "Online" check
        shop: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Process "Real-Time" Status
    const now = Date.now();
    const FIVE_MINS = 5 * 60 * 1000;

    const liveStaff = staff.map(agent => {
      // If they have pulsed in the last 5 mins, they are ONLINE
      const lastPulse = agent.lastSeen ? new Date(agent.lastSeen).getTime() : 0;
      const isOnline = (now - lastPulse) < FIVE_MINS;

      return {
        ...agent,
        // Override the DB status if they are actively working
        status: isOnline ? 'ACTIVE' : (agent.status || 'OFFLINE'), 
        // Ensure coordinates are numbers for the frontend map
        latitude: agent.lastLat || 0,
        longitude: agent.lastLng || 0
      };
    });

    return NextResponse.json(liveStaff);

  } catch (error: any) {
    console.error("❌ TEAM API ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}