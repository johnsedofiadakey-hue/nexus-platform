import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Make sure this path matches your project

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, latitude, longitude } = body;

    // 1. Validate Input
    if (!userId) return NextResponse.json({ error: "No User ID" }, { status: 400 });
    if (!latitude || !longitude) return NextResponse.json({ error: "No GPS Data" }, { status: 400 });

    console.log(`📡 RECEIVING GPS: User ${userId} at ${latitude}, ${longitude}`);

    // 2. Update Database
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        lastLat: parseFloat(latitude),
        lastLng: parseFloat(longitude),
        lastSync: new Date(), // Critical: Marks them as "Online" right now
        status: 'ACTIVE'      // Force status to ACTIVE
      }
    });

    return NextResponse.json({ success: true, time: updated.lastSync });
  } catch (error) {
    console.error("❌ GPS SAVE ERROR:", error);
    return NextResponse.json({ error: "Database Failed" }, { status: 500 });
  }
}