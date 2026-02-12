import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ count: 0 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ count: 0 });
    }

    const count = await prisma.message.count({
      where: {
        receiverId: user.id,
        isRead: false
      }
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("UNREAD_COUNT_ERROR:", error);
    return NextResponse.json({ count: 0 });
  }
}