import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const shops = await prisma.shop.findMany({
      include: {
        _count: {
          select: { users: true, inventory: true, sales: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json({ success: true, data: shops });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, location, latitude, longitude, radius } = body;

    const shop = await prisma.shop.create({
      data: {
        name,
        location,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: parseFloat(radius) || 150, // Default 150m geofence
        isActive: true,
      }
    });

    return NextResponse.json({ success: true, data: shop });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}