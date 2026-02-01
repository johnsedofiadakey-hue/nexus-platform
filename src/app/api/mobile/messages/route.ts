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
