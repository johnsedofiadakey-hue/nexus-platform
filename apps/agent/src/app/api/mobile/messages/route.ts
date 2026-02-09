import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for API routes that use database
export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json([], { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    // ✅ Resolve current user safely
    const me = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, organizationId: true },
    });

    if (!me) {
      return NextResponse.json([], { status: 401 });
    }

    // Determine whose messages we are looking at
    let viewUserId = me.id;
    if (targetUserId && (me.role === 'ADMIN' || me.role === 'SUPER_ADMIN' || me.role === 'MANAGER')) {
      // Check tenant isolation for the target user if not super admin
      if (me.role !== 'SUPER_ADMIN') {
        const targetUser = await prisma.user.findUnique({
          where: { id: targetUserId },
          select: { organizationId: true }
        });
        if (targetUser?.organizationId !== me.organizationId) {
          return NextResponse.json({ error: "Access Denied" }, { status: 403 });
        }
      }
      viewUserId = targetUserId;
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: viewUserId }, { receiverId: viewUserId }],
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    return NextResponse.json(
      messages.map((m) => ({
        ...m,
        direction: m.senderId === viewUserId ? "OUTGOING" : "INCOMING",
      }))
    );
  } catch (error) {
    console.error("MOBILE_MESSAGES_ERROR:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, receiverId } = await req.json();
    let finalReceiverId = receiverId;

    const sender = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, shopId: true, name: true, organizationId: true }
    });

    if (!sender) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 🧠 INTELLIGENT ROUTING
    if (!finalReceiverId) {
      // 1. Try to find the Shop Manager
      if (sender.shopId) {
        const manager = await prisma.user.findFirst({
          where: { shopId: sender.shopId, role: 'MANAGER' }
        });
        finalReceiverId = manager?.id;
      }

      // 2. Fallback to Super Admin (Support)
      if (!finalReceiverId) {
        const admin = await prisma.user.findFirst({
          where: { role: 'SUPER_ADMIN' }
        });
        finalReceiverId = admin?.id;
      }
    }

    if (!finalReceiverId) {
      return NextResponse.json({ error: "No support agent available" }, { status: 503 });
    }

    const message = await prisma.message.create({
      data: {
        content,
        senderId: sender.id,
        receiverId: finalReceiverId,
        isRead: false
      }
    });

    // 🔔 NOTIFICATION TRIGGER
    if (session.user.organizationId) {
      await prisma.notification.create({
        data: {
          organizationId: session.user.organizationId,
          type: 'MESSAGE',
          title: 'New Field Message',
          message: `${sender.name || 'Agent'}: ${content.substring(0, 40)}${content.length > 40 ? '...' : ''}`,
          link: `/dashboard/hr/member/${sender.id}?tab=CHAT`
        }
      });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("MESSAGE_SEND_ERROR:", error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
