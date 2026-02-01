import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ----------------------------------------------------------------------
// 1. GET: FETCH ALL SHOPS (Registry Grid)
// ----------------------------------------------------------------------
export async function GET() {
  try {
    const shops = await prisma.shop.findMany({
      orderBy: { createdAt: "desc" }, // Show newest shops first
      select: {
        id: true,
        name: true,
        location: true,
        latitude: true,
        longitude: true,
        radius: true,
        openingTime: true,
        phone: true, 
        
        // Count relations
        _count: {
          select: {
            products: true, // Matches 'products' in schema
            users: true     // Matches 'users' in schema
          }
        },
        
        // Fetch one manager for display
        users: {
          where: { role: 'MANAGER' },
          take: 1,
          select: { name: true, phone: true }
        }
      }
    });

    // Format for frontend
    const formattedShops = shops.map(shop => ({
      id: shop.id,
      name: shop.name,
      location: shop.location || "",
      
      // ⚠️ IMPORTANT: Expose these at the top level for the "Edit Form"
      latitude: shop.latitude || 0,
      longitude: shop.longitude || 0,
      radius: shop.radius || 200,
      managerName: shop.users[0]?.name || "",
      managerPhone: shop.phone || shop.users[0]?.phone || "",
      openingTime: shop.openingTime || "08:00 AM",
      
      // UI Helper Data
      contact: shop.phone || shop.users[0]?.phone || "N/A",
      inventoryCount: shop._count.products, // For the grid card
      
      // Legacy structure for Map components (if needed)
      geo: {
        lat: shop.latitude || 5.6037,
        lng: shop.longitude || -0.1870,
        radius: shop.radius || 50
      },
      
      // Pass the raw counts object for components using _count
      _count: shop._count 
    }));

    return NextResponse.json(formattedShops); // Return array directly (easier for frontend)

  } catch (error) {
    console.error("❌ Shop List Failure:", error);
    return NextResponse.json({ error: "Failed to load registry" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// 2. POST: CREATE NEW SHOP (Register Hub)
// ----------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📝 REGISTERING HUB:", body);

    // 1. Sanitize
    const name = body.name?.trim();
    const location = body.location?.trim();
    const lat = parseFloat(body.latitude);
    const lng = parseFloat(body.longitude);
    const rad = parseFloat(body.radius) || 200;

    // 2. Validate
    if (!name || isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: "Name and valid Coordinates are required" }, 
        { status: 400 }
      );
    }

    // 3. Create
    // Note: We don't save managerName directly because it's not in the Shop schema.
    // In a real app, you would create a User account for the manager here.
    const newShop = await prisma.shop.create({
      data: {
        name,
        location,
        latitude: lat,
        longitude: lng,
        radius: rad,
        openingTime: body.openingTime || "08:00 AM",
        phone: body.managerPhone // Saving manager phone to shop contact for now
      }
    });

    return NextResponse.json(newShop);

  } catch (error) {
    console.error("❌ Create Shop Failure:", error);
    return NextResponse.json({ error: "Failed to register hub" }, { status: 500 });
  }
}