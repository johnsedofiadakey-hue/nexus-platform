import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { content, type } = body;

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Find the first Admin user to send messages to
    const admin = await prisma.user.findFirst({ 
      where: { role: { in: ['SUPER_USER', 'ADMIN'] } } 
    });
    if (!admin) return NextResponse.json({ error: "No admin available to receive messages" }, { status: 404 });
    
    const message = await prisma.chatMessage.create({
      data: {
        content,
        senderId: user.id,
        receiverId: admin.id, // ✅ Send to actual admin, not self
        type: type || "TEXT",
        isRead: false
      }
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Chat Send Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}