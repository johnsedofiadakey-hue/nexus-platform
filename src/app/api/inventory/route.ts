import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const inventory = await prisma.product.findMany({
      include: {
        category: true,
        warehouse: {
          select: { name: true, location: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: inventory });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}