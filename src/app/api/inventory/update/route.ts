import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // 🛡️ 1. SECURITY: Only authorized staff can change stock
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { sku, quantity, shopId, action } = await req.json();

    if (!sku || !quantity || !shopId) {
      return NextResponse.json({ error: "Missing SKU, Quantity, or Shop ID" }, { status: 400 });
    }

    // 🔍 2. IDENTIFICATION
    // We check if the product exists in the system
    const existing = await prisma.product.findUnique({ 
      where: { sku } 
    });

    let inventory;

    // 🚀 3. TRANSACTION LOGIC
    if (existing) {
      // ⛔ STOCK GUARD: Prevent selling more than you have
      if (action !== 'ADD' && existing.quantity < quantity) {
         return NextResponse.json({ 
           success: false, 
           error: `Insufficient stock. Only ${existing.quantity} remaining.` 
         }, { status: 400 });
      }

      // ✅ UPDATE EXISTING
      inventory = await prisma.product.update({
        where: { sku },
        data: {
          quantity: action === 'ADD' ? { increment: quantity } : { decrement: quantity },
          // Only update restock date if we are actually adding stock
          lastRestock: action === 'ADD' ? new Date() : existing.lastRestock, 
          updatedAt: new Date()
        }
      });
    } else {
      // ⚠️ CREATION GUARD: Only 'ADD' action can create new items
      if (action !== 'ADD') {
        return NextResponse.json({ error: "Product not found. Cannot sell unknown item." }, { status: 404 });
      }

      // ✅ CREATE NEW (Safe Defaults)
      inventory = await prisma.product.create({
        data: {
          sku,
          shopId,
          quantity,
          productName: "New Unlisted Item", // Friendly placeholder
          priceGHS: 0, 
          category: "Uncategorized",
          formulation: "Standard",
          // Use undefined/null for relations if unknown, not empty strings
          subCategoryId: undefined 
        }
      });
    }

    return NextResponse.json({ success: true, data: inventory });

  } catch (error: any) {
    console.error("📦 INVENTORY UPDATE FAILED:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}