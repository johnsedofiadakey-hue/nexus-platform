import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; 

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { lat, lng } = await req.json();

    // Update the User's last known location
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        lastLat: lat,
        lastLng: lng,
        lastSync: new Date() // Updates the timestamp
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Location update failed" }, { status: 500 });
  }
}