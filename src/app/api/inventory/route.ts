import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Ensure you have this path correct

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Who is asking?
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Find the Staff Member & Their Shop
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { shop: true }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!user.shopId) return NextResponse.json({ error: "No Shop Assigned" }, { status: 400 });

    // 3. Fetch ONLY that shop's inventory
    const inventory = await prisma.product.findMany({
      where: { shopId: user.shopId },
      orderBy: { productName: 'asc' }
    });

    return NextResponse.json({
      shopName: user.shop?.name,
      agentName: user.name,
      items: inventory
    });

  } catch (error) {
    console.error("Inventory Fetch Error:", error);
    return NextResponse.json({ error: "Failed to load inventory" }, { status: 500 });
  }
}