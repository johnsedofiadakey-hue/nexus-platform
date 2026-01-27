import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// 🚀 Force dynamic fetching to ensure the list is always fresh
export const dynamic = 'force-dynamic';

// --- 1. GET: FETCH ALL SHOPS ---
export async function GET(req: Request) {
  try {
    const shops = await prisma.shop.findMany({
      orderBy: { createdAt: 'desc' }, // Newest first
      include: {
        _count: {
          select: { staff: true } // Count how many reps are at this shop
        },
        createdBy: {
            select: { name: true, email: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: shops });
  } catch (error: any) {
    console.error("❌ SHOPS_LIST_ERROR:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch shops" }, { status: 500 });
  }
}

// --- 2. POST: SAVE NEW SHOP ---
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, location, latitude, longitude, radius, managerName, managerPhone } = body;

    // 🛡️ Safety Check for Coordinates
    const safeLat = parseFloat(latitude);
    const safeLng = parseFloat(longitude);
    const finalLat = isNaN(safeLat) ? 0.0 : safeLat;
    const finalLng = isNaN(safeLng) ? 0.0 : safeLng;

    console.log(`📦 SHOP_SAVE: Saving '${name}' at [${finalLat}, ${finalLng}] for User: ${session.user.id}`);

    const shop = await prisma.shop.create({
      data: {
        name,
        location: location || "Unknown Location",
        latitude: finalLat,
        longitude: finalLng,
        radius: parseInt(radius) || 150,
        managerName,
        managerPhone,
        // 🔗 Link to Admin
        createdBy: {
          connect: { id: session.user.id }
        }
      },
    });

    return NextResponse.json(shop);

  } catch (error: any) {
    console.error("❌ SHOP_SAVE_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}