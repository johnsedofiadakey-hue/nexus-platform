import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const data = await prisma.shop.findMany({
      include: {
        sales: true,
        _count: { select: { users: true } }
      }
    }) || []; // Fallback to empty array

    const formatted = data.map(node => ({
      id: node.id,
      name: node.name,
      lat: node.latitude,
      lng: node.longitude,
      sales: node.sales?.reduce((acc, s) => acc + s.totalAmount, 0) || 0,
      staffCount: node._count.users || 0
    }));

    return NextResponse.json(formatted);
  } catch (e) {
    return NextResponse.json([], { status: 200 }); // Return empty array on error to keep UI alive
  }
}