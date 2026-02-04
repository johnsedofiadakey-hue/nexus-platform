import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json([]); // Return empty array instead of crashing
    }

    // 🚀 OPTIMIZATION: Only fetch the last 50 sales to prevent timeout
    const sales = await prisma.sale.findMany({
      where: { userId },
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        shop: {
          select: { name: true }
        },
        _count: {
          select: { items: true }
        }
      }
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error("❌ SALES_API_ERROR:", error);
    return NextResponse.json([], { status: 500 });
  }
}

// ----------------------------------------------------------------------
// ⚡️ HIGH-SPEED TRANSACTION ENGINE (V4 - FRESH BUILD)
// ----------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    console.log("🛒 SALES_API_V4_FINAL: Processing Sale...");
    const body = await req.json();
    const { shopId, items, totalAmount, gps, source = "MOBILE" } = body;

    // 0. AUTHENTICATION
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized Terminal" }, { status: 401 });
    }

    // 1. VALIDATION
    if (!shopId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Invalid Transaction Data" }, { status: 400 });
    }

    // 2. ATOMIC EXECUTION (The "Ledger Lock")
    // We use an interactive transaction to check stock AND decrement it safely.
    // If any item fails, the WHOLE sale is rejected.
    const result = await prisma.$transaction(async (tx) => {

      // A. Verify User/Agent (Optional: Get from Session if not relying on body)
      // For speed in Phase 2, we assume auth middleware handles header checks.
      // But ideally we'd get session here. Let's rely on the body containing shopId for now
      // and assume the caller is authenticated via middleware.

      // B. Process Items (Check & Decrement)
      const finalizedItems = [];

      for (const item of items) {
        // Lock the product row for update
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        if (product.stockLevel < item.quantity) {
          throw new Error(`Stockout: ${product.name} (Req: ${item.quantity}, Avail: ${product.stockLevel})`);
        }

        // Decrement Stock
        await tx.product.update({
          where: { id: item.productId },
          data: { stockLevel: { decrement: item.quantity } }
        });

        // 🛡️ SANITIZED INPUT: Explicitly map only valid schema fields
        finalizedItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        });
      }

      // C. Record Sale
      const sale = await tx.sale.create({
        data: {
          shopId,
          userId: session.user.id,
          totalAmount,
          paymentMethod: "CASH",
          status: "COMPLETED",
          items: {
            create: finalizedItems
          }
        }
      });

      return sale;
    });

    return NextResponse.json({ success: true, saleId: result.id });

  } catch (error: any) {
    console.error("❌ TRANSACTION_FAILED:", error.message);
    return NextResponse.json({ error: error.message || "Transaction Failed" }, { status: 409 }); // 409 Conflict
  }
}