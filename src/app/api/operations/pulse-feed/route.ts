import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. GHOST DETECTION LOGIC
    // Find reps (SALES_REP) who are clocked in but have zero sales in the last 4 hours
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    
    const ghostUsers = await prisma.user.findMany({
      where: {
        role: "SALES_REP", // 🛡️ FIX: Changed from 'USER' to 'SALES_REP'
        attendance: {      // 🛡️ FIX: Changed 'attendances' to 'attendance' (check your schema if it fails)
          some: {
            clockOutTime: null // Currently clocked in
          }
        },
        sales: {
          none: {
            createdAt: {
              gte: fourHoursAgo
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        shop: {
          select: {
            name: true
          }
        }
      },
      take: 5
    });

    // 2. RECENT SALES FEED
    const recentSales = await prisma.sale.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, image: true } },
        shop: { select: { name: true } },
        items: true
      }
    });

    // 3. Transform for Frontend
    const feed = [
      ...ghostUsers.map(u => ({
        id: `ghost-${u.id}`,
        type: 'GHOST_ALERT',
        user: u.name,
        shop: u.shop?.name || "Unknown Location",
        time: new Date().toISOString(),
        message: "No sales recorded in 4+ hours despite being clocked in.",
        severity: 'HIGH'
      })),
      ...recentSales.map(s => ({
        id: s.id,
        type: 'SALE',
        user: s.user.name,
        shop: s.shop?.name,
        amount: s.totalAmount,
        time: s.createdAt.toISOString(),
        itemsCount: s.items.length
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return NextResponse.json(feed);

  } catch (error: any) {
    console.error("❌ PULSE_FEED_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}