import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // ✅ FIXED: Pointing to the correct config file
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. SECURE SESSION CHECK
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized Access" }, { status: 401 });
    }

    // 2. IDENTIFY THE SHOP
    // We cast to 'any' because we added shopId to the session in lib/auth.ts
    const userShopId = (session.user as any).shopId;

    // Safety: If an agent isn't assigned to a hub, they see an empty list (Security First)
    if (!userShopId) {
      console.log(`⚠️ Inventory blocked: User ${session.user.email} has no assigned shop.`);
      return NextResponse.json([]); 
    }

    // 3. FETCH INVENTORY (Filtered for Speed)
    const inventory = await prisma.product.findMany({
      where: {
        shopId: userShopId,
        quantity: { gt: 0 } // 🚀 OPTIMIZATION: Only fetch items currently in stock
      },
      select: {
        id: true,
        productName: true, // ✅ Correct field name (matches schema)
        sku: true,
        priceGHS: true,
        quantity: true,
        category: true,
        formulation: true
      },
      orderBy: {
        productName: 'asc'
      }
    });

    return NextResponse.json(inventory);

  } catch (error) {
    console.error("❌ SHOP INVENTORY SYNC ERROR:", error);
    return NextResponse.json({ error: "Failed to sync shop inventory" }, { status: 500 });
  }
}