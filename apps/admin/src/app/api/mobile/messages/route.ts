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
      include: {
        sender: { select: { name: true, role: true, image: true } },
        receiver: { select: { name: true, role: true, image: true } },
      },
    });

    return NextResponse.json(
      messages.map((m) => ({
        id: m.id,
        content: m.content,
        isRead: m.isRead,
        createdAt: m.createdAt,
        senderId: m.senderId,
        receiverId: m.receiverId,
        senderName: (m as any).sender?.name || 'Unknown',
        receiverName: (m as any).receiver?.name || 'Unknown',
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
      select: { id: true, shopId: true, name: true, organizationId: true, role: true }
    });

    if (!sender) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 🧠 INTELLIGENT ROUTING - Find the best recipient
    if (!finalReceiverId) {
      // 1. Try to find the Shop Manager
      if (sender.shopId) {
        const manager = await prisma.user.findFirst({
          where: { shopId: sender.shopId, role: 'MANAGER' }
        });
        finalReceiverId = manager?.id;
      }

      // 2. Fallback to any ADMIN in the same organization
      if (!finalReceiverId && sender.organizationId) {
        const admin = await prisma.user.findFirst({
          where: {
            organizationId: sender.organizationId,
            role: { in: ['ADMIN', 'SUPER_ADMIN'] },
            status: 'ACTIVE'
          }
        });
        finalReceiverId = admin?.id;
      }

      // 3. Last resort: any SUPER_ADMIN in the system
      if (!finalReceiverId) {
        const superAdmin = await prisma.user.findFirst({
          where: { role: 'SUPER_ADMIN', status: 'ACTIVE' }
        });
        finalReceiverId = superAdmin?.id;
      }
    }

    if (!finalReceiverId) {
      return NextResponse.json({ error: "No support agent available. Please contact your administrator." }, { status: 503 });
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
    const senderOrg = sender.organizationId || (session.user as any).organizationId;
    if (senderOrg) {
      try {
        await prisma.notification.create({
          data: {
            organizationId: senderOrg,
            type: 'MESSAGE',
            title: 'New Field Message',
            message: `${sender.name || 'Agent'}: ${content.substring(0, 40)}${content.length > 40 ? '...' : ''}`,
            link: `/dashboard/messages`
          }
        });
      } catch (notifErr) {
        console.warn('Notification creation failed (non-blocking):', notifErr);
      }
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("MESSAGE_SEND_ERROR:", error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
