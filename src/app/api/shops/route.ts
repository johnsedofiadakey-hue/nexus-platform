import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ✅ Force fresh data every time
export const dynamic = 'force-dynamic';

// GET: Fetch all shops
export async function GET() {
  try {
    const shops = await prisma.shop.findMany({
      orderBy: { createdAt: 'desc' }, // Newest first
      include: {
        _count: { select: { users: true, inventory: true } }
      }
    });
    return NextResponse.json(shops);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch shops" }, { status: 500 });
  }
}

// POST: Create a new shop
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, location, lat, lng, radius, managerName, managerPhone, openingTime } = body;

    const shop = await prisma.shop.create({
      data: {
        name,
        location,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        radius: parseInt(radius) || 150,
        managerName,
        managerPhone, // ✅ Added Contact
        openingTime
      }
    });

    return NextResponse.json(shop);
  } catch (error) {
    console.error("Create Shop Error:", error);
    return NextResponse.json({ error: "Failed to create shop" }, { status: 500 });
  }
}

// PATCH: Edit an existing shop
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, name, location, lat, lng, radius, managerName, managerPhone, openingTime } = body;

    const shop = await prisma.shop.update({
      where: { id },
      data: {
        name,
        location,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        radius: parseInt(radius) || 150,
        managerName,
        managerPhone, // ✅ Added Contact
        openingTime
      }
    });

    return NextResponse.json(shop);
  } catch (error) {
    console.error("Edit Shop Error:", error);
    return NextResponse.json({ error: "Failed to update shop" }, { status: 500 });
  }
}