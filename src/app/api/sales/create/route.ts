import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { items, paymentMethod, totalAmount } = body;

    // 1. Get Agent Details
    const agent = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { shop: true }
    });

    if (!agent?.shopId) return NextResponse.json({ error: "No Shop Assigned" }, { status: 403 });

    // 2. Transaction: Create Sale & Deduct Stock
    const sale = await prisma.$transaction(async (tx) => {
      // A. Create Sale Record
      const newSale = await tx.sale.create({
        data: {
          userId: agent.id,
          shopId: agent.shopId!,
          totalAmount,
          paymentMethod,
          items: {
            create: items.map((i: any) => ({
              productId: i.id,
              quantity: i.qty,
              price: i.price
            }))
          }
        }
      });

      // B. Deduct Inventory
      for (const item of items) {
        await tx.product.update({
          where: { id: item.id },
          data: { stockLevel: { decrement: item.qty } }
        });
      }

      return newSale;
    });

    return NextResponse.json({ success: true, saleId: sale.id });

  } catch (error) {
    console.error("Sale Error:", error);
    return NextResponse.json({ error: "Transaction Failed" }, { status: 500 });
  }
}