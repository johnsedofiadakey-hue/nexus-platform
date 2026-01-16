import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const shop = await prisma.shop.findUnique({
      where: { id: params.id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            role: true,
            status: true,
            lastLat: true,
            lastLng: true,
            image: true,
            sales: {
               where: { shopId: params.id }
            }
          }
        },
        inventory: true,
        _count: { select: { sales: true } }
      }
    });

    return NextResponse.json({ success: true, data: shop });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}