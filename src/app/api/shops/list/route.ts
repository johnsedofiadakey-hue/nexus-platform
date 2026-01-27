import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 🚀 Force dynamic rendering to ensure live counts
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const startTime = performance.now();

    const shops = await prisma.shop.findMany({
      orderBy: { name: 'asc' },
      select: {
        // Basic Identity
        id: true,
        name: true,
        location: true,
        
        // Geofence / Map Data
        latitude: true,
        longitude: true,
        radius: true,
        
        // Management Info
        managerName: true,
        managerPhone: true,
        openingTime: true,
        
        // 🚀 LIVE COUNTERS (The missing link)
        _count: {
          select: { 
            inventory: true, // Shows "5 Items" on card
            staff: true      // Shows "3 Staff" on card (or 'users' if your schema uses that)
          }
        }
      }
    });

    const endTime = performance.now();
    console.log(`📡 Shop List Sync: ${shops.length} nodes in ${(endTime - startTime).toFixed(2)}ms`);

    return NextResponse.json(shops);

  } catch (error: any) {
    console.error("❌ Shop API Failure:", error);
    return NextResponse.json(
      { error: "Failed to fetch retail nodes", details: error.message }, 
      { status: 500 }
    );
  }
}