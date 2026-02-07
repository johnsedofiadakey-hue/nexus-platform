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

    // MAP DATABASE FIELDS FOR MOBILE POS CONSISTENCY
    return NextResponse.json({
      data: products.map(p => ({
        id: p.id,
        // Mobile POS expects these exact fields:
        productName: p.name,
        name: p.name,
        sku: p.barcode || p.id.substring(0, 6).toUpperCase(),
        barcode: p.barcode || p.id.substring(0, 6).toUpperCase(),
        priceGHS: p.sellingPrice,
        price: p.sellingPrice,
        sellingPrice: p.sellingPrice,
        stockLevel: p.stockLevel,
        quantity: p.stockLevel,
        stock: p.stockLevel,
        category: p.category || "General",
        shopId: p.shopId,
        hub: p.shop?.name || "Unknown",
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