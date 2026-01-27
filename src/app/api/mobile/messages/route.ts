import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json([], { status: 401 });

    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: session.user.id }, { receiverId: session.user.id }],
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    return NextResponse.json(messages.map(m => ({
      ...m,
      direction: m.senderId === session.user.id ? "OUTGOING" : "INCOMING",
    })));
  } catch (e) {
    return NextResponse.json({ error: "Sync Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 📥 Supports both naming conventions for maximum compatibility
    const { content, targetUserId, receiverId: legacyId } = await req.json();
    const finalTargetId = targetUserId || legacyId;

    const sender = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!sender) return NextResponse.json({ error: "Sender not found" }, { status: 404 });

    let resolvedReceiverId: string | undefined;

    // --- 🛰️ ROUTING LOGIC ---
    if (sender.role === "SALES_REP") {
      // Reps always talk to the Admin
      const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      resolvedReceiverId = admin?.id;
    } else {
      // Admins/HR must specify who they are talking to
      resolvedReceiverId = finalTargetId;
    }

    if (!resolvedReceiverId) {
      return NextResponse.json({ error: "No recipient specified" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        content,
        senderId: sender.id,
        receiverId: resolvedReceiverId,
      },
    });

    return NextResponse.json(message);
  } catch (e: any) {
    console.error("NEXUS_MESSAGE_CRASH:", e.message); // Check terminal for this!
    return NextResponse.json({ error: "Database rejected message" }, { status: 500 });
  }
}