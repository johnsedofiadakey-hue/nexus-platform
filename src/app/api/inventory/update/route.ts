import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { sku, quantity, shopId, action } = await req.json();
    
    const inventory = await prisma.inventory.upsert({
      where: { sku_shopId: { sku, shopId } }, // Requires a compound unique constraint in schema
      update: {
        quantity: action === 'ADD' ? { increment: quantity } : { decrement: quantity },
        lastRestock: new Date()
      },
      create: {
        sku,
        shopId,
        quantity,
        productName: "Pending Identification", // Typically fetched from a Master Product list
        category: "General Electronics",
        priceGHS: 0,
      }
    });

    return NextResponse.json({ success: true, data: inventory });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}