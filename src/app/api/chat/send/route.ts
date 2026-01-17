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

    // In a real app, 'receiverId' would be dynamic. 
    // For now, we assume messages go to a generic 'ADMIN' pool or a specific Admin user ID.
    // We will just create the record linked to the sender.
    
    // Note: Since we haven't seeded an "ADMIN" user ID yet, we will just Log it for now 
    // to prevent the app from crashing if it can't find a receiver.
    // In production, you would do: receiverId: "admin-id-here"
    
    const message = await prisma.chatMessage.create({
      data: {
        content,
        senderId: user.id,
        receiverId: user.id, // ⚠️ TEMP: Sending to self just to save record, or find an Admin ID
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