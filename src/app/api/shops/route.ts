import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const shops = await prisma.shop.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            staff: true,      // 👈 THIS MUST BE 'staff', NOT 'users'
            inventory: true,
            sales: true
          }
        }
      }
    });

    return NextResponse.json(shops);
  } catch (error) {
    console.error("Shop API Error:", error);
    return NextResponse.json([]); // Return empty list on error
  }
}