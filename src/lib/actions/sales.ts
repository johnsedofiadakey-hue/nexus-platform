"use server"

import { prisma } from "@/lib/prisma";
import { checkGeofence } from "@/lib/sentinel";

export async function processSale(data: {
  staffId: string;
  shopId: string;
  items: any[];
  total: number;
  latitude: number;
  longitude: number;
}) {
  // 1. Fetch the Shop's official location
  const shop = await prisma.shop.findUnique({
    where: { id: data.shopId }
  });

  if (!shop) throw new Error("Shop not found");

  // 2. The Golden Rule: Verify Geofence on Server
  const isValidLocation = checkGeofence(
    data.latitude,
    data.longitude,
    shop.latitude,
    shop.longitude,
    shop.radius
  );

  if (!isValidLocation) {
    // Log this as a security violation
    console.error(`SECURITY ALERT: Staff ${data.staffId} attempted sale outside geofence.`);
    return { success: false, error: "ACCESS_DENIED: Outside Geofence" };
  }

  // 3. Process Sale & Reduce Inventory
  const transaction = await prisma.$transaction([
    prisma.sale.create({
      data: {
        staffId: data.staffId,
        shopId: data.shopId,
        totalAmount: data.total,
        items: data.items,
        latitude: data.latitude,
        longitude: data.longitude,
      }
    }),
    // Logic to loop through items and decrement shop inventory here...
  ]);

  return { success: true, data: transaction[0] };
}