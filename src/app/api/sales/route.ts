import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; 

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 1. Authenticate the User (Security Check)
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Find the Real User & Shop from DB
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { shop: true }
    });

    if (!user || !user.shopId) {
      return NextResponse.json({ error: "User or Shop invalid" }, { status: 400 });
    }

    // 3. Process the Data
    const body = await req.json();
    const { items, totalAmount, gps } = body; // items = [{ productId, quantity, price }]

    // 4. Create the Sale Record
    const sale = await prisma.sale.create({
      data: {
        userId: user.id,
        shopId: user.shopId,
        totalAmount: totalAmount,
        paymentMethod: "CASH",
        latitude: gps?.lat || null,
        longitude: gps?.lng || null,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            priceAtSale: item.price
          }))
        }
      }
    });

    // 5. Update Inventory (Subtract Stock)
    // We loop through items to update product counts
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity } }
      });
    }

    return NextResponse.json({ success: true, saleId: sale.id });

  } catch (error) {
    console.error("Sales Error:", error);
    return NextResponse.json({ error: "Transaction Failed" }, { status: 500 });
  }
}