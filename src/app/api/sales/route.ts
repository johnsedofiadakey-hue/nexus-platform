import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json([]); // Return empty array instead of crashing
    }

    // 🚀 OPTIMIZATION: Only fetch the last 50 sales to prevent timeout
    const sales = await prisma.sale.findMany({
      where: { userId },
      take: 50, 
      orderBy: { createdAt: 'desc' },
      include: {
        shop: {
          select: { name: true }
        },
        _count: {
          select: { items: true }
        }
      }
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error("❌ SALES_API_ERROR:", error);
    return NextResponse.json([], { status: 500 }); // Return empty array on error
  }
}