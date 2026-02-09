import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get shopId from query params
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json({ error: "Shop ID required" }, { status: 400 });
    }

    // Fetch products for this shop
    const products = await prisma.product.findMany({
      where: {
        shopId: shopId
      },
      select: {
        id: true,
        name: true,
        barcode: true,
        category: true,
        sellingPrice: true,
        stockLevel: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Transform to expected format
    const inventory = products.map(p => ({
      id: p.id,
      productName: p.name,
      sku: p.barcode || undefined,
      category: p.category || undefined,
      priceGHS: p.sellingPrice,
      quantity: p.stockLevel,
      stockLevel: p.stockLevel
    }));

    return NextResponse.json(inventory);

  } catch (error) {
    console.error("Inventory API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}
