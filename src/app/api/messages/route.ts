import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET: Fetch conversation between Admin and Specific Staff
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get("staffId");
    // In a real app, get 'adminId' from session. For now, we simulate "Admin"
    const adminId = "admin-hq-id"; 

    if (!staffId) return NextResponse.json([], { status: 400 });

    const messages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: adminId, receiverId: staffId },
          { senderId: staffId, receiverId: adminId }
        ]
      },
      orderBy: { createdAt: 'asc' }, // Oldest first (like WhatsApp)
      include: {
        sender: { select: { name: true, role: true } }
      }
    });

    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load chat" }, { status: 500 });
  }
}

// POST: Send a new message
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { content, receiverId, senderId } = body; 

    const message = await prisma.chatMessage.create({
      data: {
        content,
        receiverId,
        senderId: senderId || "admin-hq-id", // Default to Admin if sending from Dashboard
        type: "TEXT"
      }
    });

    return NextResponse.json(message);
  } catch (error) {
    return NextResponse.json({ error: "Message failed" }, { status: 500 });
  }
}