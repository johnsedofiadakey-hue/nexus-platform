import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shopId");

  if (!shopId) {
    return NextResponse.json({ error: "Shop ID required" }, { status: 400 });
  }

  const products = await prisma.product.findMany({
    where: { 
      shopId: shopId,
      quantity: { gt: 0 } // Only show items in stock
    },
    orderBy: { name: 'asc' }
  });

  // MAP DATABASE FIELDS TO YOUR FRONTEND EXPECTATIONS
  const mappedProducts = products.map(p => ({
    id: p.id,
    productName: p.name,       // Maps 'name' -> 'productName'
    sku: p.id.substring(0,6).toUpperCase(), // Fake SKU if missing
    quantity: p.quantity,
    priceGHS: p.price          // Maps 'price' -> 'priceGHS'
  }));

  return NextResponse.json(mappedProducts);
}