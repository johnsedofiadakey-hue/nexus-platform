import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";import { logActivity, getClientIp, getUserAgent } from "@/lib/activity-logger";
export async function POST(req: Request) {
  try {
    // 🛡️ AUTH
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sku, quantity, shopId, action } = await req.json();

    if (!sku || !quantity || !shopId || !action) {
      return NextResponse.json(
        { error: "Missing sku, quantity, shopId, or action" },
        { status: 400 }
      );
    }

    if (!["ADD", "SELL"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // 🚀 ATOMIC TRANSACTION
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { barcode: sku, shopId },
      });

      // ❌ SELLING NON-EXISTENT ITEM
      if (!product && action !== "ADD") {
        throw new Error("Product not found in this shop");
      }

      // ❌ INSUFFICIENT STOCK
      if (product && action === "SELL" && product.stockLevel < quantity) {
        throw new Error(
          `Insufficient stock. Only ${product.stockLevel} remaining`
        );
      }

      // ✅ UPDATE EXISTING
      if (product) {
        return tx.product.update({
          where: { id: product.id },
          data: {
            stockLevel:
              action === "ADD"
                ? { increment: quantity }
                : { decrement: quantity },
          },
        });
      }

      // ✅ CREATE NEW PRODUCT (ADD ONLY)
      return tx.product.create({
        data: {
          barcode: sku,
          shopId,
          stockLevel: quantity,
          name: "New Unlisted Item",
          sellingPrice: 0,
          category: "Uncategorized",
          // formulation: "FINISHED_GOOD", // Not in schema
        },
      });
    });

    // 📊 Log Activity
    const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { name: true } });
    await logActivity({
      userId: session.user.id,
      userName: session.user.name || "Unknown",
      userRole: (session.user as any).role || "USER",
      action: action === "ADD" ? "INVENTORY_ADDED" : "INVENTORY_SOLD",
      entity: "Product",
      entityId: result.id,
      description: `${action === "ADD" ? "Added" : "Sold"} ${quantity} units of ${result.name} (SKU: ${sku})`,
      metadata: { productId: result.id, sku, quantity, action },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      shopId,
      shopName: shop?.name || "Unknown Shop"
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("📦 INVENTORY UPDATE FAILED:", error.message);

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
