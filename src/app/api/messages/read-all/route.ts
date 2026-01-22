import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/sessionUser";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const sessionUser = await resolveSessionUser(session);
    if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = sessionUser.id;

    // Mark all incoming messages for this user as read
    await prisma.chatMessage.updateMany({
      where: {
        receiverId: userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}