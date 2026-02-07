import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-helpers";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shopId");

  try {
    // 🔐 Require authentication
    const user = await requireAuth();

    let whereClause: any = {};

    // 🏢 Multi-tenancy enforcement
    if (shopId) {
      // Verify shop belongs to user's organization
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        select: { organizationId: true }
      });

      if (shop && user.role !== "SUPER_ADMIN") {
        if (shop.organizationId !== user.organizationId) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
      whereClause.shopId = shopId;
    } else {
      // No shopId: filter by organization
      if (user.role === "SUPER_ADMIN" && !user.organizationId) {
        // Super admin sees all
      } else {
        // Filter products through shops in user's organization
        whereClause.shop = { organizationId: user.organizationId };
      }
    }

    // PAGINATION
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const [total, products] = await Promise.all([
      prisma.product.count({ where: whereClause }),
      prisma.product.findMany({
        where: whereClause,
        include: {
          shop: { select: { name: true } }
        },
        orderBy: { name: 'asc' },
        take: limit,
        skip: skip
      })
    ]);

    // MAP DATABASE FIELDS TO YOUR FRONTEND EXPECTATIONS
    return NextResponse.json({
      data: products.map(p => ({
        id: p.id,
        name: p.name,          // Master Inventory expects 'name'
        productName: p.name,   // Mobile might expect 'productName'
        sku: p.barcode || p.id.substring(0, 6).toUpperCase(),
        stock: p.stockLevel,   // Master uses 'stock'
        quantity: p.stockLevel,// Mobile uses 'quantity'
        price: p.sellingPrice, // Master uses 'price'
        priceGHS: p.sellingPrice, // Mobile uses 'priceGHS'
        hub: p.shop?.name || "Unknown", // Master Inventory expects 'hub'
        shopId: p.shopId, // 👈 Added for Actions
        status: p.stockLevel <= (p.minStock || 5) ? 'Low Stock' : 'In Stock'
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error("Inventory Fetch Error:", error.message);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}