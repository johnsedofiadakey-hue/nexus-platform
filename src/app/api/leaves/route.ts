import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET: Fetch Leaves (Filter by User ID if provided)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const leaves = await prisma.leaveRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(leaves);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch leaves" }, { status: 500 });
  }
}

// POST: Create a Leave Request (For Mobile App)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, type, startDate, endDate, reason } = body;

    const leave = await prisma.leaveRequest.create({
      data: {
        userId,
        type, // e.g., "Sick", "Annual"
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status: "PENDING"
      }
    });

    return NextResponse.json(leave);
  } catch (error) {
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}