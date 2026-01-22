import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: Fetch conversation history
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const staffId = searchParams.get("staffId");
  const myId = session.user.id;

  // If Admin is viewing a staff page, fetch chat between Admin and that Staff
  // If Staff is viewing their own mobile chat, fetch chat between Staff and Admin(s)
  const targetId = staffId || myId; 

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: myId, receiverId: staffId! },
        { senderId: staffId!, receiverId: myId }
      ]
    },
    orderBy: { createdAt: 'asc' }, // Oldest first (chat log style)
  });

  return NextResponse.json(messages);
}

// POST: Send a new message
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { content, receiverId } = body;

    const message = await prisma.message.create({
      data: {
        content,
        senderId: session.user.id,
        receiverId,
        read: false
      }
    });

    return NextResponse.json(message);
  } catch (error) {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}