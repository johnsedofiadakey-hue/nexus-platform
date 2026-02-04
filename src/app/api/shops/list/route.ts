import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// ----------------------------------------------------------------------
// 1. GET: FETCH ALL SHOPS (Registry Grid)
// ----------------------------------------------------------------------
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Relaxed Check: Allow Super Admin or return empty if no Org
    const orgId = session.user.organizationId;
    const userId = session.user.id;
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN';

    // Query Strategy:
    // 1. If Super Admin -> All shops (Show everything, even unlinked ones)
    // 2. If Org ID exists -> Shops in Org
    // 3. Fallback: Shops created by this user
    const whereClause = isSuperAdmin
      ? {} // SHOW ALL
      : orgId
        ? { organizationId: orgId }
        : { users: { some: { id: userId } } };

    const shops = await prisma.shop.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
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
            products: true,
            users: true
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
      inventoryCount: shop._count.products,

      // Legacy structure for Map components (if needed)
      geo: {
        lat: shop.latitude || 5.6037,
        lng: shop.longitude || -0.1870,
        radius: shop.radius || 50
      },

      // Pass the raw counts object for components using _count
      _count: shop._count
    }));

    return NextResponse.json(formattedShops);

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
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Handle Admin Logic
    let orgId = session.user.organizationId;
    if (!orgId && session.user.role === 'SUPER_ADMIN') {
      const defaultOrg = await prisma.organization.findFirst();
      orgId = defaultOrg?.id;
    }

    if (!orgId) {
      return NextResponse.json({ error: "Organization Context Required" }, { status: 400 });
    }

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
    const newShop = await prisma.shop.create({
      data: {
        organizationId: orgId, // 🔐 Link to Organization
        name,
        location,
        latitude: lat,
        longitude: lng,
        radius: rad,
        openingTime: body.openingTime || "08:00 AM",
        phone: body.managerPhone
      }
    });

    return NextResponse.json(newShop);

  } catch (error) {
    console.error("❌ Create Shop Failure:", error);
    return NextResponse.json({ error: "Failed to register hub" }, { status: 500 });
  }
}