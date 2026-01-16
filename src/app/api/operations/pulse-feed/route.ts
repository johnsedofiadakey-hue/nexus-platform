// path: /src/app/api/operations/pulse-feed/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // This named import is now valid!

export async function GET() {
  try {
    // Check connection first to prevent silent crashes
    await prisma.$connect();

    // Fetch the 10 most recent transactions from our Geographical Nodes (Accra/Kumasi)
    const pulses = await prisma.sale.findMany({
      take: 10,
      orderBy: { 
        createdAt: 'desc' 
      },
      include: {
        shop: {
          select: {
            name: true,
            location: true,
          }
        },
        user: {
          select: {
            name: true,
            role: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      count: pulses.length,
      data: pulses,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error: any) {
    console.error("📡 [NEXUS PULSE ERROR]:", error.message);
    
    return NextResponse.json({
      success: false,
      error: "Strategic Data Feed Interrupted",
      detail: process.env.NODE_ENV === "development" ? error.message : undefined
    }, { status: 500 });
  } finally {
    // In serverless/API routes, we usually don't disconnect, 
    // but we ensure the connection pool is managed by the singleton.
  }
}