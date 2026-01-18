import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { items, totalAmount, gps } = await req.json();

    // 1. Identify Seller & Shop
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { shop: true }
    });

    if (!user || !user.shopId) {
      return NextResponse.json({ error: "User/Shop not identified" }, { status: 400 });
    }

    // 2. Transaction: Create Sale + Update Inventory (Atomic)
    const transaction = await prisma.$transaction(async (tx) => {
      
      // A. Create the Sale Record
      const sale = await tx.sale.create({
        data: {
          userId: user.id,
          shopId: user.shopId!,
          totalAmount: parseFloat(totalAmount),
          latitude: gps?.lat || 0,
          longitude: gps?.lng || 0,
          paymentMethod: "CASH", // Default for now
          items: {
            create: items.map((i: any) => ({
              productId: i.productId,
              quantity: i.quantity,
              priceAtSale: i.price
            }))
          }
        }
      });

      // B. Deduct Inventory (Loop through items)
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } }
        });
      }

      return sale;
    });

    return NextResponse.json({ success: true, saleId: transaction.id });

  } catch (error) {
    console.error("Sale Error:", error);
    return NextResponse.json({ error: "Transaction Failed" }, { status: 500 });
  }
}