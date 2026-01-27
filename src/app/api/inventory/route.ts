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
        quantity: { gt: 0 } // Only show items in stock
      },
      // 🛡️ FIX: Changed 'name' to 'productName' to match your schema
      orderBy: { productName: 'asc' } 
    });

    // MAP DATABASE FIELDS TO YOUR FRONTEND EXPECTATIONS
    const mappedProducts = products.map(p => ({
      id: p.id,
      productName: p.productName, // Database field is already 'productName'
      sku: p.sku || p.id.substring(0, 6).toUpperCase(), 
      quantity: p.quantity,
      priceGHS: p.priceGHS // Database field is already 'priceGHS'
    }));

    return NextResponse.json(mappedProducts);
  } catch (error: any) {
    console.error("Inventory Fetch Error:", error.message);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}