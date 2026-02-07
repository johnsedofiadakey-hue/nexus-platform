import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// ----------------------------------------------------------------------
// 1. GET: FETCH CONVERSATION WITH A USER
// ----------------------------------------------------------------------
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json({ error: "Target User ID required" }, { status: 400 });
    }

    // ⚡️ OPTIMIZED: Fetch messages with select + add limit to prevent huge queries
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: session.user.id }
        ]
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        isRead: true,
        createdAt: true,
        senderId: true,
        receiverId: true,
        sender: { 
          select: { 
            name: true, 
            role: true,
            image: true
          } 
        }
      },
      take: 100 // Limit to last 100 messages for performance
    });

    return NextResponse.json(messages);

  } catch (error) {
    console.error("GET_MESSAGES_ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// 2. POST: SEND A MESSAGE
// ----------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { receiverId, content } = body;

    if (!receiverId || !content) {
      return NextResponse.json({ error: "Receiver and Content required" }, { status: 400 });
    }

    // Verify receiver is in the same org (Security)
    const receiver = await prisma.user.findFirst({
      where: { id: receiverId, organizationId: session.user.organizationId }
    });

    if (!receiver) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content
      }
    });

    return NextResponse.json(message);

  } catch (error) {
    console.error("SEND_MESSAGE_ERROR:", error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
