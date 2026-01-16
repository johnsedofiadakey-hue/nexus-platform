import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { leaveId, userId, action, returnDate } = await req.json();

    // 1. Update the Leave Request Status
    const leaveUpdate = prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' }
    });

    // 2. If approved, lock the User's portal until the return date
    const userUpdate = prisma.user.update({
      where: { id: userId },
      data: { 
        status: action === 'APPROVE' ? 'ON_LEAVE' : 'ACTIVE',
        isSuspended: action === 'APPROVE' ? true : false 
      }
    });

    await prisma.$transaction([leaveUpdate, userUpdate]);

    return NextResponse.json({ success: true, message: `Personnel access ${action === 'APPROVE' ? 'locked for leave' : 'maintained'}` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}