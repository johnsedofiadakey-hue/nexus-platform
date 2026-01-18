import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json([], { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    const userShopId = user?.shopId;

    const whereClause: any = {};
    const { searchParams } = new URL(req.url);
    const specificShopId = searchParams.get("shopId");

    // Security & Filtering
    if (specificShopId) {
      whereClause.shopId = specificShopId;
    } else if (user?.role !== "SUPER_USER" && user?.role !== "ADMIN" && userShopId) {
      whereClause.shopId = userShopId;
    }

    // 1. Fetch Products AND their Sales History
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        shop: { select: { name: true, id: true } }, // Include Shop ID for filtering
        subCategory: { select: { name: true } },
        // ✅ NEW: Count how many times this item appears in sales
        _count: {
          select: { saleItems: true } 
        }
      },
      orderBy: { productName: 'asc' }
    });

    // 2. Transform for Analytics
    const formattedProducts = products.map(p => ({
      id: p.sku || p.id,
      dbId: p.id,
      name: p.productName,
      cat: p.formulation === "RAW_MATERIAL" ? "Raw Material" : "Finished Good",
      subCat: p.subCategory?.name || "General",
      hub: p.shop?.name || "Unassigned",
      hubId: p.shop?.id, // Important for frontend filtering
      stock: p.quantity,
      minStock: p.minStock,
      sku: p.sku,
      unit: "Units",
      // ✅ LOGIC: If stock is low, mark 'Low Stock'. Else 'Available'.
      status: p.quantity <= p.minStock ? "Low Stock" : "Available",
      price: p.priceGHS,
      // ✅ LOGIC: Velocity = Number of times sold
      salesVelocity: p._count.saleItems 
    }));

    return NextResponse.json(formattedProducts);

  } catch (error) {
    console.error("Inventory GET Error:", error);
    return NextResponse.json({ error: "Failed to load inventory" }, { status: 500 });
  }
}

// POST, PATCH, DELETE methods remain exactly the same as previous...
// (Keep the existing POST/PATCH/DELETE code below this)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      productName, sku, price, quantity, minStock, 
      shopId, category, subCategory 
    } = body;

    if (!productName || !shopId || !price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let catRecord = await prisma.category.findUnique({ where: { name: category } });
    if (!catRecord) catRecord = await prisma.category.create({ data: { name: category } });

    let subRecord = await prisma.subCategory.findFirst({ where: { name: subCategory, categoryId: catRecord.id } });
    if (!subRecord) subRecord = await prisma.subCategory.create({ data: { name: subCategory, categoryId: catRecord.id } });

    const product = await prisma.product.create({
      data: {
        productName,
        sku,
        priceGHS: parseFloat(price),
        quantity: parseInt(quantity),
        minStock: parseInt(minStock),
        formulation: "FINISHED_GOOD",
        shopId: shopId,
        subCategoryId: subRecord.id
      }
    });

    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Save Failed" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, quantity, price, productName, sku, minStock } = body;

    if (!id) return NextResponse.json({ error: "Product ID required" }, { status: 400 });

    const updateData: any = { lastRestock: new Date() };
    if (quantity !== undefined) updateData.quantity = parseInt(quantity);
    if (price !== undefined) updateData.priceGHS = parseFloat(price);
    if (productName !== undefined) updateData.productName = productName;
    if (sku !== undefined) updateData.sku = sku;
    if (minStock !== undefined) updateData.minStock = parseInt(minStock);

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    return NextResponse.json({ error: "Update Failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2003') {
      return NextResponse.json({ error: "Cannot delete: This item has sales history." }, { status: 400 });
    }
    return NextResponse.json({ error: "Delete Failed" }, { status: 500 });
  }
}