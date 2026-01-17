import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // We will ensure this exists shortly

export async function POST(req: Request) {
  try {
    // 1. Verify User Identity (Security)
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get Data from Phone (GPS & Shop ID)
    const body = await req.json();
    const { lat, lng, shopId } = body;

    if (!lat || !lng) {
      return NextResponse.json({ error: "GPS coordinates required" }, { status: 400 });
    }

    // 3. Find the User in DB
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 4. Create Attendance Record
    const record = await prisma.attendance.create({
      data: {
        userId: user.id,
        clockInTime: new Date(),
        clockInGPS: `${lat},${lng}`,
        date: new Date(), // Tracks "Today's" shift
      }
    });

    return NextResponse.json({ success: true, record });

  } catch (error) {
    console.error("Clock-In Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}