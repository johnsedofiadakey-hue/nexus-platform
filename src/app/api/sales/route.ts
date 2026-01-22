import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { shopId, items, totalAmount, gps } = body;

    if (!shopId || !items || items.length === 0) {
      return NextResponse.json({ error: "Invalid Data" }, { status: 400 });
    }

    // TRANSACTION: Record Sale + Update Inventory
    const sale = await prisma.$transaction(async (tx) => {
      // 1. Create Sale Record
      const newSale = await tx.sale.create({
        data: {
          userId: session.user.id,
          shopId: shopId,
          totalAmount: totalAmount,
          paymentMethod: "CASH", // Default for now
          items: {
            create: items.map((i: any) => ({
              productId: i.productId,
              quantity: i.quantity,
              price: i.price,
              name: "Product" // Ideally fetch real name, but this is faster
            }))
          }
        }
      });

      // 2. Deduct Inventory
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } }
        });
      }

      // 3. (Optional) Log GPS Location if you have a Location Log table
      // await tx.locationLog.create(...)

      return newSale;
    });

    return NextResponse.json({ success: true, saleId: sale.id });

  } catch (error) {
    console.error("Sales API Error:", error);
    return NextResponse.json({ error: "Transaction Failed" }, { status: 500 });
  }
}