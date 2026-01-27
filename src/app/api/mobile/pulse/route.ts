import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // 1. Verify who is sending the pulse
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lat, lng } = await req.json();

    // 2. Update the Database
    // This sets "lastSeen" to NOW(), which makes them appear green/online
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        lastLat: lat,
        lastLng: lng,
        lastSeen: new Date(), 
        status: 'ACTIVE'      
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: "Pulse Failed" }, { status: 500 });
  }
}