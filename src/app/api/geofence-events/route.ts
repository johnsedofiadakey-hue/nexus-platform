import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // Fetch geofence events for the user, ordered by timestamp desc (most recent first)
    const events = await prisma.geofenceEvent.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      take: 50, // Limit to last 50 events
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Geofence events fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch geofence events" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, shopId, type, lat, lng } = body;

    if (!userId || !shopId || !type || lat === undefined || lng === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!['EXIT', 'ENTER'].includes(type)) {
      return NextResponse.json({ error: "Invalid type, must be EXIT or ENTER" }, { status: 400 });
    }

    // Create the geofence event
    const event = await prisma.geofenceEvent.create({
      data: {
        userId,
        shopId,
        type,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Geofence event creation error:", error);
    return NextResponse.json({ error: "Failed to create geofence event" }, { status: 500 });
  }
}