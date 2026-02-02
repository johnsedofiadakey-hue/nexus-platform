import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shopId");

  if (!shopId) {
    return NextResponse.json({ error: "Shop ID required" }, { status: 400 });
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        shopId: shopId,
        stockLevel: { gt: 0 } // Only show items in stock
      },
      // 🛡️ FIX: Changed 'name' to 'productName' to match your schema
      // 🛡️ FIX: Changed 'productName' to 'name' to match your schema
      orderBy: { name: 'asc' }
    });

    // MAP DATABASE FIELDS TO YOUR FRONTEND EXPECTATIONS
    return NextResponse.json(products.map(p => ({
      id: p.id,
      productName: p.name,
      sku: p.barcode || p.id.substring(0, 6).toUpperCase(), // Use barcode if available, otherwise fallback
      quantity: p.stockLevel,
      priceGHS: p.sellingPrice
    })));
  } catch (error: any) {
    console.error("Inventory Fetch Error:", error.message);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}