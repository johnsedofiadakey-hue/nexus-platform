import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const shops = await prisma.shop.findMany({
      include: {
        _count: { select: { users: true } },
        sales: {
          where: {
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
          }
        }
      }
    });

    const mapData = shops.map(shop => {
      const todaySales = shop.sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
      return {
        id: shop.id,
        name: shop.name,
        lat: shop.latitude,
        lng: shop.longitude,
        status: todaySales > 0 ? "ACTIVE" : "INACTIVE",
        sales: todaySales,
        staffCount: shop._count.users
      };
    });

    return NextResponse.json(mapData, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch map data" }, { status: 500 });
  }
}