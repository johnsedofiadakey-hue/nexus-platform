import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * -----------------------------------------
 * GET — Fetch conversation messages
 * Used by HQ dashboards
 * -----------------------------------------
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json([], { status: 401 });
    }

    const userId = session.user.id;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      orderBy: { createdAt: "asc" },
      take: 100
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("MESSAGES GET ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

/**
 * -----------------------------------------
 * POST — Send message (HQ → Staff OR Staff → HQ)
 * -----------------------------------------
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, receiverId } = await req.json();

    if (!content || !receiverId) {
      return NextResponse.json(
        { error: "Missing content or receiverId" },
        { status: 400 }
      );
    }

    const senderId = session.user.id;

    // Prevent sending message to self
    if (senderId === receiverId) {
      return NextResponse.json(
        { error: "Cannot send message to yourself" },
        { status: 400 }
      );
    }

    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        receiverId
      }
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("MESSAGE SEND ERROR:", error);
    return NextResponse.json(
      { error: "Message send failed" },
      { status: 500 }
    );
  }
}
