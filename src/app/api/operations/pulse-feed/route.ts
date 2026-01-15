import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Use the singleton we just made

export async function GET() {
  try {
    // 1. Handshake check
    await prisma.$connect();

    // 2. Fetch data
    const recentSales = await prisma.sale.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        shop: { select: { name: true } },
        user: { select: { name: true } }
      }
    });

    // 3. Return JSON
    return NextResponse.json(recentSales);
  } catch (error: any) {
    // This logs the REAL error to your terminal (Check your VS Code terminal!)
    console.error("DATABASE_ERROR_LOG:", error);
    
    return NextResponse.json(
      { error: "Database Link Failure", details: error.message },
      { status: 500 }
    );
  }
}