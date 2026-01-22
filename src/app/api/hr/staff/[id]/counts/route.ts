import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staffId = (await params).id;

    // Define the start of the current day for daily report counting
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // 🏎️ Parallel Execution for Maximum Speed
    const [msgCount, reportCount, leaveCount] = await Promise.all([
      // 1. Unread Messages (Where receiver is this staff member)
      prisma.chatMessage.count({
        where: {
          receiverId: staffId,
          isRead: false
        }
      }),

      // 2. Daily Reports (Submitted Today)
      prisma.dailyReport.count({
        where: {
          userId: staffId,
          createdAt: {
            gte: startOfDay
          }
        }
      }),

      // 3. Pending Leave Requests
      prisma.leaveRequest.count({
        where: {
          userId: staffId,
          status: 'PENDING'
        }
      })
    ]);

    return NextResponse.json({
      msgCount,
      reportCount,
      leaveCount,
      success: true
    });

  } catch (error) {
    console.error("Counter Intelligence Failure:", error);
    return NextResponse.json({ 
      msgCount: 0, 
      reportCount: 0, 
      leaveCount: 0, 
      success: false 
    }, { status: 500 });
  }
}