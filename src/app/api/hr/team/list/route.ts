import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * 🛰️ NEXUS TEAM REGISTRY API
 * Optimized for high-speed synchronization and geofence tracking.
 */
export async function GET() {
  try {
    const staff = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        role: true,
        email: true,
        phone: true,
        status: true,
        shopId: true,
        isInsideZone: true,
        image: true, // Restored: Requires 'npx prisma db push'
        shop: {
          select: {
            id: true,
            name: true,
            location: true,
            latitude: true,
            longitude: true,
            radius: true
          }
        },
        attendance: {
          take: 1,
          orderBy: { date: 'desc' },
          select: { checkIn: true }
        }
      },
    });

    const formattedTeam = staff.map((user) => ({
      id: user.id,
      name: user.name || "Unknown Agent",
      role: user.role,
      status: user.status === "ACTIVE" ? "Active" : "Offline",
      shop: user.shop?.name || "Unassigned",
      shopId: user.shopId,
      image: user.image,
      
      // Geofence context
      location: user.shop ? {
        lat: user.shop.latitude || 5.6037,
        lng: user.shop.longitude || -0.1870
      } : { lat: 5.6037, lng: -0.1870 },
      
      lastActive: user.attendance?.[0]?.checkIn || new Date(),
      isInsideZone: user.isInsideZone || false
    }));

    return NextResponse.json({ 
      data: formattedTeam, 
      meta: { total: staff.length } 
    });

  } catch (error: any) {
    console.error("❌ TEAM_LIST_SYNC_FAILURE:", error.message);

    // Specific guard for the Prepared Statement crash
    if (error.message.includes("prepared statement")) {
      return NextResponse.json(
        { error: "Database Cache Desync. Please retry in 5s.", code: "POOL_RESET" }, 
        { status: 503 }
      );
    }

    return NextResponse.json({ data: [], error: "Internal System Error" }, { status: 500 });
  }
}