import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/sessionUser";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // 1. Session Check with Fallback for Simulation
    if (!session?.user) {
      console.error("❌ LEAVE API: No active session detected.");
      return NextResponse.json({ error: "Unauthorized. Please re-login." }, { status: 401 });
    }

    const body = await req.json();
    const { userId, type, startDate, endDate, reason } = body;

    // 2. Critical Field Validation
    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Please provide both Start and End dates." }, { status: 400 });
    }

    // 3. Resolve userId (Using session if frontend ID is missing/cached)
    let activeUserId = userId;
    if (!activeUserId) {
      const sessionUser = await resolveSessionUser(session);
      if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      activeUserId = sessionUser.id;
    }

    console.log(`🚀 Processing Leave Request for User: ${activeUserId}`);

    // 4. Create Record with Prisma
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId: activeUserId,
        type: type || 'ANNUAL',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason: reason || "Field Request",
        status: 'PENDING'
      }
    });

    console.log("✅ Leave Request successfully saved to Database.");
    return NextResponse.json(leaveRequest);

  } catch (error: any) {
    console.error("❌ LEAVE SYSTEM CRITICAL ERROR:", error.message);
    
    // Provide specific feedback for Simulation troubleshooting
    return NextResponse.json({ 
      error: "Database Rejection", 
      message: error.message,
      code: error.code 
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    const where: any = {};
    if (userId) where.userId = userId;

    const leaves = await prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ leaves });
  } catch (error) {
    console.error('GET /api/leaves error', error);
    return NextResponse.json({ error: 'Failed to fetch leaves' }, { status: 500 });
  }
}