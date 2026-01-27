import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            location: true,
            latitude: true,
            longitude: true,
            radius: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 🚨 CRITICAL: If agent has no assigned shop, GPS MUST stay locked
    if (!user.shop) {
      return NextResponse.json({
        agentName: user.name,
        agentId: user.id,
        role: user.role,
        shopAssigned: false,
      });
    }

    return NextResponse.json({
      agentName: user.name,
      agentId: user.id,
      role: user.role,

      shopAssigned: true,
      shopId: user.shop.id,
      shopName: user.shop.name,

      // 🛰️ GPS PAYLOAD (THIS UNBLOCKS EVERYTHING)
      shopLat: user.shop.latitude,
      shopLng: user.shop.longitude,
      radius: user.shop.radius ?? 200,
    });

  } catch (error) {
    console.error("MOBILE INIT ERROR:", error);
    return NextResponse.json({ error: "Init Failed" }, { status: 500 });
  }
}
