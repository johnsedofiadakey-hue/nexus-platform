import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for API routes that use database
export const dynamic = 'force-dynamic';
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

    // Find all admin/manager users in this organization for "shared inbox" behavior
    const orgAdmins = await prisma.user.findMany({
      where: {
        organizationId: session.user.organizationId,
        role: { in: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] }
      },
      select: { id: true }
    });
    const adminIds = orgAdmins.map(a => a.id);

    // Show ALL messages between the target agent and ANY admin in the org
    // This ensures messages don't "disappear" when routed to a different admin
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: targetUserId, receiverId: { in: adminIds } },
          { senderId: { in: adminIds }, receiverId: targetUserId }
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
      take: 100
    });

    // Mark unread messages from this agent as read 
    await prisma.message.updateMany({
      where: {
        senderId: targetUserId,
        receiverId: { in: adminIds },
        isRead: false
      },
      data: { isRead: true }
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
