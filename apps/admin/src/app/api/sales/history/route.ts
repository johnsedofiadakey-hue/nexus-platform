import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for API routes that use database
export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Resolve user from DB to get shopId (not available in JWT token)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { shopId: true }
    });

    const userShopId = user?.shopId;

    if (!userShopId) {
      return NextResponse.json([]); // Return empty if no shop assigned
    }

    // 🚀 FETCH SALES HISTORY
    // We limit to the last 50 transactions for speed
    const sales = await prisma.sale.findMany({
      where: {
        shopId: userShopId,
        // Optional: Filter by today only? 
        // createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) }
      },
      select: {
        id: true,
        totalAmount: true,
        paymentMethod: true,
        createdAt: true,
        // We don't need full items list for the log view, makes it faster
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    return NextResponse.json(sales);

  } catch (error) {
    console.error("HISTORY FETCH ERROR:", error);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}