import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET: Fetch All Shops
export async function GET() {
  try {
    const shops = await prisma.shop.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { users: true, inventory: true } // Include counts for the cards
        }
      }
    });
    return NextResponse.json(shops);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load shops" }, { status: 500 });
  }
}

// POST: Create New Shop
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Convert strings to numbers for the DB
    const lat = parseFloat(body.lat);
    const lng = parseFloat(body.lng);
    const rad = parseFloat(body.radius) || 150;

    const shop = await prisma.shop.create({
      data: {
        name: body.name,
        location: body.location,
        latitude: isNaN(lat) ? 0 : lat,
        longitude: isNaN(lng) ? 0 : lng,
        radius: rad,
        managerName: body.managerName,
        managerPhone: body.managerPhone,
        openingTime: body.openingTime
      }
    });

    return NextResponse.json(shop);
  } catch (error) {
    console.error("Create Shop Error:", error);
    return NextResponse.json({ error: "Failed to create shop" }, { status: 500 });
  }
}

// PATCH: Edit Existing Shop (The Missing Piece!)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, lat, lng, radius, ...rest } = body;

    if (!id) {
      return NextResponse.json({ error: "Shop ID required" }, { status: 400 });
    }

    // Handle number conversions safely
    const updateData: any = { ...rest };
    if (lat) updateData.latitude = parseFloat(lat);
    if (lng) updateData.longitude = parseFloat(lng);
    if (radius) updateData.radius = parseFloat(radius);

    const updatedShop = await prisma.shop.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updatedShop);

  } catch (error) {
    console.error("Update Shop Error:", error);
    return NextResponse.json({ error: "Failed to update shop" }, { status: 500 });
  }
}

// DELETE: Remove Shop
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    // Check if shop has dependencies (Users or Sales) before deleting
    // Prisma might throw an error if we don't, or we can catch the foreign key error
    await prisma.shop.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    // P2003 is Prisma's code for "Foreign key constraint failed"
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: "Cannot delete: This shop has active staff or inventory." 
      }, { status: 400 });
    }
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}