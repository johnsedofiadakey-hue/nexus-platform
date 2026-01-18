import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET: Fetch conversation
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Who am I?
    const me = await prisma.user.findUnique({ 
      where: { email: session.user.email },
      select: { id: true, role: true }
    });
    if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 2. Who is the other person?
    const { searchParams } = new URL(req.url);
    const otherPersonId = searchParams.get("staffId");

    // 3. Build the Conversation Filter
    let whereClause: any = {};

    if (otherPersonId) {
      // SCENARIO A: Admin viewing a specific staff member (Strict 1-on-1)
      // Show messages where (I sent to Them) OR (They sent to Me)
      whereClause = {
        OR: [
          { senderId: me.id, receiverId: otherPersonId },
          { senderId: otherPersonId, receiverId: me.id }
        ]
      };
    } else {
      // SCENARIO B: Mobile User viewing their own chat (usually with Admin/HQ)
      // Show messages where (I sent) OR (I received)
      whereClause = {
        OR: [
          { senderId: me.id },
          { receiverId: me.id }
        ]
      };
    }

    // 4. Fetch
    const messages = await prisma.chatMessage.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' }, // Oldest at top
      include: {
        sender: { select: { id: true, name: true, role: true } },
        receiver: { select: { id: true, name: true, role: true } }
      }
    });

    // 5. Inject "isMe" flag for the frontend to simplify logic
    // This solves the "Left vs Right" confusion definitively.
    const enrichedMessages = messages.map(msg => ({
      ...msg,
      isMe: msg.senderId === me.id // True if I sent it
    }));

    return NextResponse.json(enrichedMessages);

  } catch (error) {
    console.error("Chat GET Error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST: Send a message
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { content, receiverId } = body; 

    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    // 1. Who am I?
    const sender = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!sender) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 2. Who receives?
    let finalReceiverId = receiverId;

    // Mobile "HQ" Logic: If sending to "admin-hq-id" or undefined, find a Super User/Admin
    if (receiverId === "admin-hq-id" || !receiverId) {
      const admin = await prisma.user.findFirst({ where: { role: { in: ['SUPER_USER', 'ADMIN'] } } });
      if (!admin) return NextResponse.json({ error: "No admin found to receive messages" }, { status: 404 });
      finalReceiverId = admin.id;
    }

    // 3. Validate receiver exists
    const receiver = await prisma.user.findUnique({ where: { id: finalReceiverId } });
    if (!receiver) return NextResponse.json({ error: "Receiver not found" }, { status: 404 });

    // 4. Save to database
    const message = await prisma.chatMessage.create({
      data: {
        content,
        senderId: sender.id, // Strictly use the Session ID as Sender
        receiverId: finalReceiverId,
        type: "TEXT",
        isRead: false
      },
      include: {
        sender: { select: { id: true, name: true, role: true } }
      }
    });

    return NextResponse.json(message);

  } catch (error) {
    console.error("Message POST Error:", error);
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
}

// PATCH: Edit a message
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, content } = body;

    if (!id || !content) return NextResponse.json({ error: "Missing data" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    
    // Authorization Check: Ensure the user editing is the actual sender
    const existingMessage = await prisma.chatMessage.findUnique({ where: { id } });
    if (!existingMessage) return NextResponse.json({ error: "Message not found" }, { status: 404 });
    
    if (existingMessage.senderId !== user?.id) {
      return NextResponse.json({ error: "You can only edit your own messages" }, { status: 403 });
    }

    const updatedMessage = await prisma.chatMessage.update({
      where: { id },
      data: { content }
    });

    return NextResponse.json(updatedMessage);

  } catch (error) {
    console.error("Message PATCH Error:", error);
    return NextResponse.json({ error: "Edit failed" }, { status: 500 });
  }
}

// DELETE: Delete a message
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });

    // Authorization Check: Ensure the user deleting is the actual sender
    const existingMessage = await prisma.chatMessage.findUnique({ where: { id } });
    if (!existingMessage) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    if (existingMessage.senderId !== user?.id) {
      return NextResponse.json({ error: "You can only delete your own messages" }, { status: 403 });
    }

    await prisma.chatMessage.delete({ where: { id } });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Message DELETE Error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}