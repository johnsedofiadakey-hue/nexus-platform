import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shopId");
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let whereClause: any = {
      stockLevel: { gt: 0 }
    };

    // If shopId is provided, filter by it.
    if (shopId) {
      whereClause.shopId = shopId;
    } else {
      // If NO shopId, check if user is allowed to see all (Admin/SuperAdmin)
      // Or if user is linked to a shop, default to their shop
      const userRole = (session.user as any).role;
      const userShopId = (session.user as any).shopId;

      if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
        // Allow global fetch - No restriction
      } else if (userShopId) {
        // Default to user's shop
        whereClause.shopId = userShopId;
      } else {
        return NextResponse.json({ error: "Shop Context Required" }, { status: 400 });
      }
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        shop: { select: { name: true } }
      },
      orderBy: { name: 'asc' }
    });

    // MAP DATABASE FIELDS TO YOUR FRONTEND EXPECTATIONS
    return NextResponse.json(products.map(p => ({
      id: p.id,
      name: p.name,          // Master Inventory expects 'name'
      productName: p.name,   // Mobile might expect 'productName'
      sku: p.barcode || p.id.substring(0, 6).toUpperCase(),
      stock: p.stockLevel,   // Master uses 'stock'
      quantity: p.stockLevel,// Mobile uses 'quantity'
      price: p.sellingPrice, // Master uses 'price'
      priceGHS: p.sellingPrice, // Mobile uses 'priceGHS'
      hub: p.shop?.name || "Unknown", // Master Inventory expects 'hub'
      status: p.stockLevel <= (p.minStock || 5) ? 'Low Stock' : 'In Stock'
    })));
  } catch (error: any) {
    console.error("Inventory Fetch Error:", error.message);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}