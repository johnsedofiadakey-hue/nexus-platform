"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type SaleItemInput = {
    productId: string;
    quantity: number;
    price: number;
};

export type TransactionResult =
    | { success: true; saleId: string }
    | { success: false; error: string };

export async function processTransaction(
    userId: string,
    shopId: string,
    totalAmount: number,
    items: SaleItemInput[],
    paymentMethod: string = "CASH"
): Promise<TransactionResult> {
    console.log("💳 SERVER_ACTION: Initiating Sale for User:", userId);
    console.log("🏪 Shop ID:", shopId);
    console.log("💰 Total Amount:", totalAmount);
    console.log("📦 Items Count:", items.length);

    try {
        // 1. Validation
        if (!userId || !shopId || items.length === 0) {
            console.error("❌ VALIDATION FAILED:", { userId, shopId, itemsCount: items.length });
            return { success: false, error: "Invalid Data: Missing User, Shop, or Items" };
        }

        if (totalAmount <= 0) {
            console.error("❌ INVALID AMOUNT:", totalAmount);
            return { success: false, error: "Invalid transaction amount" };
        }

        // 2. Transaction
        const sale = await prisma.$transaction(async (tx) => {
            const saleLines = [];

            for (const item of items) {
                // A. Check Stock
                const product = await tx.product.findUnique({
                    where: { id: item.productId }
                });

                if (!product) {
                    console.error(`❌ Product Not Found: ${item.productId}`);
                    throw new Error(`Product Not Found: ${item.productId}`);
                }

                if (product.stockLevel < item.quantity) {
                    console.error(`❌ Insufficient Stock: ${product.name} (Need: ${item.quantity}, Have: ${product.stockLevel})`);
                    throw new Error(`Out of Stock: ${product.name} (Need: ${item.quantity}, Available: ${product.stockLevel})`);
                }

                console.log(`✅ Stock Check Passed: ${product.name} (Deducting: ${item.quantity})`);

                // B. Decrement Stock
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stockLevel: { decrement: item.quantity } }
                });

                // C. Prepare Line Item (STRICT TYPE MAPPING)
                // Explicitly constructing query to avoid "productName" injection
                saleLines.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price
                });
            }

            // D. Create Sale Record
            const createdSale = await tx.sale.create({
                data: {
                    userId,
                    shopId,
                    totalAmount,
                    paymentMethod,
                    status: "COMPLETED",
                    items: {
                        create: saleLines
                    }
                }
            });

            console.log("✅ DATABASE: Sale record created:", createdSale.id);
            return createdSale;
        });

        console.log("✅ SERVER_ACTION: Sale Completed:", sale.id);

        // 3. Revalidate Paths (Dashboard/History)
        revalidatePath("/dashboard");
        revalidatePath("/mobilepos/history");
        revalidatePath("/mobilepos");

        return { success: true, saleId: sale.id };

    } catch (error: any) {
        console.error("❌ SERVER_ACTION_ERROR:", error.message);
        console.error("Stack:", error.stack);
        return { success: false, error: error.message || "Transaction Failed" };
    }
}
