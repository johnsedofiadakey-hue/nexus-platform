import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json([], { status: 401 });
    }

    // ✅ Resolve user safely via email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json([], { status: 401 });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: user.id }, { receiverId: user.id }],
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    return NextResponse.json(
      messages.map((m) => ({
        ...m,
        direction: m.senderId === user.id ? "OUTGOING" : "INCOMING",
      }))
    );
  } catch (error) {
    console.error("MOBILE_MESSAGES_ERROR:", error);
    return NextResponse.json([], { status: 500 });
  }
}

/**
 * POST - Send message from mobile
 * If receiverId not provided, defaults to sending to admin user
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve sender
    const sender = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!sender) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const body = await req.json();
    const { content, receiverId } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    // If receiverId not provided, default to admin
    let finalReceiverId = receiverId;
    if (!finalReceiverId) {
      const admin = await prisma.user.findFirst({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      if (!admin) {
        return NextResponse.json(
          { error: "No admin user found to send message to" },
          { status: 404 }
        );
      }

      finalReceiverId = admin.id;
    }

    // Prevent self-messaging
    if (sender.id === finalReceiverId) {
      return NextResponse.json(
        { error: "Cannot message yourself" },
        { status: 400 }
      );
    }

    const message = await prisma.message.create({
      data: {
        content,
        senderId: sender.id,
        receiverId: finalReceiverId,
      },
    });

    return NextResponse.json({
      ...message,
      direction: "OUTGOING",
    });
  } catch (error) {
    console.error("MOBILE_MESSAGES_POST_ERROR:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
