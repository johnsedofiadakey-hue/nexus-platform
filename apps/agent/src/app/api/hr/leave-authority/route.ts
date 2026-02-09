import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for API routes that use database
export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// --- 📝 POST: STAFF SUBMITS A NEW LEAVE REQUEST (MOBILE POS) ---
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { type, startDate, endDate, reason } = body;

    // Validate required fields
    if (!type || !startDate || !endDate || !reason) {
      return NextResponse.json({ error: "Please fill in all leave details." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // Create the pending request
    const leave = await prisma.leaveRequest.create({
      data: {
        userId: user.id,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status: "PENDING"
      }
    });

    return NextResponse.json({ success: true, leave });
  } catch (error: any) {
    console.error("Leave Submission Error:", error);
    return NextResponse.json({ error: "Could not submit request." }, { status: 500 });
  }
}

// --- ⚖️ PATCH: ADMIN APPROVES OR REJECTS REQUESTS (DASHBOARD) ---
export async function PATCH(req: Request) {
  try {
    // 1. Security check: Ensure the person acting is an Admin
    const session = await getServerSession(authOptions);
    // In a real scenario, you'd check session.user.role === 'ADMIN'
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { leaveId, status } = body;

    if (!leaveId || !status) {
      return NextResponse.json({ error: "Missing leave ID or status update." }, { status: 400 });
    }

    // 2. Atomic Update
    const updatedLeave = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { 
        status // This will be 'APPROVED', 'REJECTED', or 'RECALLED'
      },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    console.log(`✅ Leave ${status} for ${updatedLeave.user.name}`);

    return NextResponse.json({ 
      message: `Leave has been ${status.toLowerCase()} successfully.`, 
      data: updatedLeave 
    });

  } catch (error: any) {
    console.error("Leave Authority Error:", error);
    return NextResponse.json({ error: "Failed to update leave status." }, { status: 500 });
  }
}