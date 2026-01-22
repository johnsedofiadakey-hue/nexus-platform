import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Fetch User & Shop Details
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { shop: true }
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 2. Calculate Real Sales Stats (Current Month)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const salesStats = await prisma.sale.aggregate({
    where: {
      userId: user.id,
      createdAt: { gte: startOfMonth }
    },
    _sum: {
      totalAmount: true,
    },
    _count: {
      id: true
    }
  });

  const currentRev = salesStats._sum.totalAmount || 0;
  const currentVol = salesStats._count.id || 0;

  // 3. Return Complete Data Packet expected by Frontend
  return NextResponse.json({
    // Identity
    agentName: user.name,
    shopName: user.shop?.name || null,
    shopId: user.shopId || null,

    // Geofencing (Defaults if shop has no coords)
    shopLat: user.shop?.latitude || 0,
    shopLng: user.shop?.longitude || 0,
    radius: user.shop?.radius || 100,

    // KPI Metrics (Real Data)
    currentRev: currentRev,
    currentVol: currentVol,
    
    // Targets (Hardcoded defaults for now, can be DB fields later)
    monthlyTargetRev: 50000, 
    monthlyTargetVol: 100
  });
}