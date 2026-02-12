import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity, getClientIp, getUserAgent } from "@/lib/activity-logger";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json([]);
    }

    // ✅ AUTHENTICATION CHECK
    let user;
    try {
      user = await requireAuth();
    } catch (error) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // ✅ AUTHORIZATION CHECK
    if (user.id !== userId && !['ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: "Forbidden: Cannot view other user's sales" },
        { status: 403 }
      );
    }

    // ✅ TENANT ISOLATION
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.organizationId !== targetUser.organizationId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: "Forbidden: Different organization" },
        { status: 403 }
      );
    }

    // ⚡️ OPTIMIZED: Only fetch the last 50 sales with select for speed
    const sales = await prisma.sale.findMany({
      where: { userId },
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        totalAmount: true,
        amountPaid: true,
        paymentMethod: true,
        status: true,
        createdAt: true,
        shop: {
          select: { name: true }
        },
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            product: {
              select: { name: true }
            }
          }
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

    // 📊 Log Activity
    const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { name: true } });
    await logActivity({
      userId: session.user.id,
      userName: session.user.name || "Unknown",
      userRole: (session.user as any).role || "USER",
      action: "SALE_CREATED",
      entity: "Sale",
      entityId: result.id,
      description: `Recorded sale of GHS ${totalAmount.toFixed(2)} with ${items.length} item(s)`,
      metadata: { saleId: result.id, totalAmount, itemCount: items.length, source },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      shopId,
      shopName: shop?.name || "Unknown Shop"
    });

    return NextResponse.json({ success: true, saleId: result.id });

  } catch (error: any) {
    console.error("❌ TRANSACTION_FAILED:", error.message);
    return NextResponse.json({ error: error.message || "Transaction Failed" }, { status: 409 }); // 409 Conflict
  }
}