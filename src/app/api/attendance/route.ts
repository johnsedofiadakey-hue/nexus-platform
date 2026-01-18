import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: Fetch Attendance History
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const logs = await prisma.attendance.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 30 // Last 30 shifts
    });

    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

// POST: Clock In / Out (Used by Mobile)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { userId, action, gps } = body; // action: 'CLOCK_IN' or 'CLOCK_OUT'

    // If client didn't provide userId, try to resolve from session
    if (!userId) {
      try {
        const session = await getServerSession(authOptions);
        if (session?.user?.email) {
          const u = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
          if (u) userId = u.id;
        }
      } catch (e) {
        console.warn('[attendance POST] session resolution failed', e);
      }
    }

    if (!userId) {
      console.warn('[attendance POST] missing userId in request body and no session user');
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Stronger validation: ensure userId is a non-empty string
    if (typeof userId !== 'string' || userId.trim() === '') {
      console.warn('[attendance POST] invalid userId:', userId);
      return NextResponse.json({ error: 'userId must be a valid string' }, { status: 400 });
    }

    // Validate user exists
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      console.warn('[attendance POST] user not found:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0,0,0,0);

    // Find today's record
    let record = await prisma.attendance.findFirst({
      where: {
        userId,
        date: { gte: today }
      }
    });

    if (action === 'CLOCK_IN') {
      if (!record) {
        // Use relation connect to ensure Prisma links to an existing user
        record = await prisma.attendance.create({
          data: {
            user: { connect: { id: userId } },
            date: new Date(),
            clockInTime: new Date(),
            clockInGPS: gps ? `${gps.lat},${gps.lng}` : null,
            status: "PRESENT"
          }
        });
      }
    } else if (action === 'CLOCK_OUT') {
      if (record) {
        await prisma.attendance.update({
          where: { id: record.id },
          data: {
            clockOutTime: new Date(),
            clockOutGPS: gps ? `${gps.lat},${gps.lng}` : null
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Clocking failed" }, { status: 500 });
  }
}