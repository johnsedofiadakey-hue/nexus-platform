import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // 🔐 HARD AUTH GUARD
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /**
     * ✅ CRITICAL FIX
     * JWT sessions may NOT contain user.id reliably.
     * We must resolve the user using email (guaranteed).
     */
    if (!session.user.email) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    // 🧠 Resolve user safely
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { shop: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    // 🚫 UNASSIGNED AGENT (EXPLICIT FAILURE)
    if (!user.shop) {
      return NextResponse.json(
        {
          error: "UNASSIGNED",
          agentName: user.name
        },
        { status: 409 } // ⬅️ IMPORTANT
      );
    }

    // ✅ SUCCESS (MOBILE SAFE CONTRACT)
    return NextResponse.json(
      {
        agentName: user.name,
        shopName: user.shop.name,
        shopLat: Number(user.shop.latitude),
        shopLng: Number(user.shop.longitude),
        radius: Number(user.shop.radius ?? 100)
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("MOBILE INIT ERROR:", error);
    return NextResponse.json(
      { error: "SYSTEM_FAILURE" },
      { status: 500 }
    );
  }
}
