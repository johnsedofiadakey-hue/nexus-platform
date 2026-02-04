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

    try {
        // 1. Validation
        if (!userId || !shopId || items.length === 0) {
            return { success: false, error: "Invalid Data: Missing User, Shop, or Items" };
        }

        // 2. Transaction
        const sale = await prisma.$transaction(async (tx) => {
            const saleLines = [];

            for (const item of items) {
                // A. Check Stock
                const product = await tx.product.findUnique({
                    where: { id: item.productId }
                });

                if (!product) throw new Error(`Product Not Found: ${item.productId}`);

                if (product.stockLevel < item.quantity) {
                    throw new Error(`Out of Stock: ${product.name}`);
                }

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
            return await tx.sale.create({
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
        });

        console.log("✅ SERVER_ACTION: Sale Completed:", sale.id);

        // 3. Revalidate Paths (Dashboard/History)
        revalidatePath("/dashboard");
        revalidatePath("/mobilepos/history");
        revalidatePath("/mobilepos");

        return { success: true, saleId: sale.id };

    } catch (error: any) {
        console.error("❌ SERVER_ACTION_ERROR:", error.message);
        return { success: false, error: error.message || "Transaction Failed" };
    }
}
