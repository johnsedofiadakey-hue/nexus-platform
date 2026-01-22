import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. GHOST DETECTION LOGIC
    // Find users who are clocked in but have zero sales in the last 4 hours
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    
    const ghostUsers = await prisma.user.findMany({
      where: {
        role: 'USER',
        attendances: {
          some: { clockOutTime: null } // Currently clocked in
        },
        sales: {
          none: { createdAt: { gte: fourHoursAgo } } // No sales recently
        }
      },
      select: { id: true, name: true, shop: { select: { name: true } } }
    });

    // 2. LIVE INTEL (From your existing daily-reports folder)
    const intel = await prisma.dailyReport.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } }
    });

    // 3. RECENT SALES (From your existing sales folder)
    const sales = await prisma.sale.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } }
    });

    return NextResponse.json({
      ghosts: ghostUsers,
      intel,
      sales,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    return NextResponse.json({ error: "Pulse engine failure" }, { status: 500 });
  }
}