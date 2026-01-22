import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/sessionUser";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ count: 0 });
    const sessionUser = await resolveSessionUser(session);
    if (!sessionUser) return NextResponse.json({ count: 0 });
    const userId = sessionUser.id;

    // Count messages sent to this user that haven't been read yet
    const count = await prisma.chatMessage.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });

    return NextResponse.json({ count });
  } catch (error) {
    return NextResponse.json({ count: 0 });
  }
}