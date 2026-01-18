import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch User with Shop & Sales Data
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { 
        shop: true,
        _count: { select: { sales: true } }
      }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 2. Calculate Live Revenue (Sum of today's or month's sales)
    const revenueAgg = await prisma.sale.aggregate({
      where: { userId: user.id },
      _sum: { totalAmount: true }
    });
    const currentRev = revenueAgg._sum.totalAmount || 0;

    // 3. Return the exact shape MobileHome expects
    return NextResponse.json({
      agentName: user.name,
      shopName: user.shop?.name || "Unassigned",
      shopLat: user.shop?.latitude || 0,
      shopLng: user.shop?.longitude || 0,
      radius: user.shop?.radius || 100,
      monthlyTargetRev: user.monthlyTargetRev,
      monthlyTargetVol: user.monthlyTargetVol,
      currentRev: currentRev,
      currentVol: user._count.sales
    });

  } catch (error) {
    console.error("Mobile Init Error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}