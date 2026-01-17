import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { type, startDate, endDate, reason } = body;

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Save to DB
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
  } catch (error) {
    console.error("Leave Request Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}