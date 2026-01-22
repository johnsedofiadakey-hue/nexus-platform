import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { sku, quantity, shopId, action } = await req.json();
    
    // Use sku as unique key for identification. If a product exists, update quantity; otherwise create a new product.
    const existing = await prisma.product.findUnique({ where: { sku } });
    let inventory;
    if (existing) {
      inventory = await prisma.product.update({
        where: { sku },
        data: {
          quantity: action === 'ADD' ? { increment: quantity } : { decrement: quantity },
          lastRestock: new Date()
        }
      });
    } else {
      inventory = await prisma.product.create({
        data: {
          sku,
          shopId,
          quantity,
          productName: "Pending Identification",
          priceGHS: 0,
          subCategoryId: "", // Placeholder; consider adding a default subcategory or validation
        }
      });
    }

    return NextResponse.json({ success: true, data: inventory });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}