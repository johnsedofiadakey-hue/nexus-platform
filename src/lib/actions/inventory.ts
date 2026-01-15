"use server"

import { prisma } from "@/lib/prisma";

export async function deployStock(data: {
  productId: string;
  targetShopId: string;
  quantity: number;
}) {
  return await prisma.$transaction(async (tx) => {
    // 1. Reduce HQ Stock
    const product = await tx.inventory.update({
      where: { id: data.productId },
      data: { quantity: { decrement: data.quantity } }
    });

    if (product.quantity < 0) {
      throw new Error("Insufficient HQ Stock");
    }

    // 2. Upsert Shop Stock
    // This finds the item in the shop's inventory or creates it if it's the first time
    const shopStock = await tx.inventory.upsert({
      where: { 
        // Unique constraint on productId + shopId
        productShopIdentifier: {
          productId: data.productId,
          shopId: data.targetShopId
        }
      },
      update: { quantity: { increment: data.quantity } },
      create: {
        productId: data.productId,
        shopId: data.targetShopId,
        quantity: data.quantity,
        productName: product.productName,
        priceGHS: product.priceGHS
      }
    });

    return { success: true, shopStock };
  });
}