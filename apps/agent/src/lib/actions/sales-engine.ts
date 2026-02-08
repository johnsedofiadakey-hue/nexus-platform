"use server"

import { prisma } from "@/lib/prisma";
import { checkGeofence } from "@/lib/sentinel";
import { revalidatePath } from "next/cache";

export async function submitSaleAction(formData: {
  staffId: string;
  shopId: string;
  items: { productId: string; qty: number; price: number }[];
  location: { lat: number; lng: number };
}) {
  // 1. ENGINE CHECK: Verify Location
  const shop = await prisma.shop.findUnique({ where: { id: formData.shopId } });

  const isValid = checkGeofence(
    formData.location.lat,
    formData.location.lng,
    shop!.latitude,
    shop!.longitude,
    shop!.radius
  );

  if (!isValid) return { error: "GEOLOCATION_LOCK: You are outside the shop radius." };

  // 2. ENGINE PROCESS: Atomic Transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create the Sale Record
      const sale = await tx.sale.create({
        data: {
          userId: formData.staffId,
          shopId: formData.shopId,
          totalAmount: formData.items.reduce((acc, item) => acc + (item.price * item.qty), 0),
          items: {
            create: formData.items.map(item => ({
              productId: item.productId,
              quantity: item.qty,
              price: item.price
            }))
          }
          // Removed latitude/longitude as they are not in the Sale schema
        }
      });

      // Update Inventory Spokes (Reduce stock for each item)
      for (const item of formData.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockLevel: { decrement: item.qty } }
        });
      }

      return sale;
    });

    revalidatePath('/admin/dashboard'); // Refresh admin view automatically
    return { success: true, data: result };
  } catch (e) {
    return { error: "DATABASE_ERROR: Transaction failed." };
  }
}