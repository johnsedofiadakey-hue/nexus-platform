"use server"

import { prisma } from "@/lib/prisma";

export async function deployStock(data: {
  productId: string;
  targetShopId: string;
  quantity: number;
}) {
  return await prisma.$transaction(async (tx) => {
    // 1. Reduce HQ Stock
    const product = await tx.product.update({
      where: { id: data.productId },
      data: { stockLevel: { decrement: data.quantity } }
    });

    if (product.stockLevel < 0) {
      throw new Error("Insufficient HQ Stock");
    }

    // 2. Add to Shop Stock
    // Find matching product in target shop by name (approximate match)
    const existing = await tx.product.findFirst({
      where: {
        shopId: data.targetShopId,
        name: product.name
      }
    });

    if (existing) {
      // Update existing
      return {
        success: true,
        shopStock: await tx.product.update({
          where: { id: existing.id },
          data: { stockLevel: { increment: data.quantity } }
        })
      };
    } else {
      // Create new
      return {
        success: true,
        shopStock: await tx.product.create({
          data: {
            shopId: data.targetShopId,
            stockLevel: data.quantity,
            name: product.name,
            sellingPrice: product.sellingPrice,
            buyingPrice: product.buyingPrice,
            category: product.category,
            // Barcode must be unique, so we omit it or append shopId to make it unique? 
            // Better to leave blank for now to avoid collision error
            barcode: null
          }
        })
      };
    }
  });
}