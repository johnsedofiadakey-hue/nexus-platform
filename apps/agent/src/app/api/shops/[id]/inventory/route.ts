import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for API routes that use database
export const dynamic = 'force-dynamic';

// ----------------------------------------------------------------------
// 1. GET: FETCH INVENTORY
// ----------------------------------------------------------------------
export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;

    const products = await prisma.product.findMany({
      where: { shopId: params.id },
      orderBy: { updatedAt: "desc" }, // Show most recently changed/added items first
    });

    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load inventory" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// 2. POST: CREATE ITEM OR RESTOCK
// ----------------------------------------------------------------------
export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const body = await req.json();

    console.log(`\n📦 INVENTORY ACTION [Shop: ${params.id}]`, body);

    //Options A: RESTOCK (Update Quantity Only)
    if (body.action === 'RESTOCK') {
      if (!body.productId || !body.amount) {
        return NextResponse.json({ error: "Product ID and Amount required" }, { status: 400 });
      }

      const updated = await prisma.product.update({
        where: { id: body.productId },
        data: {
          stockLevel: { increment: parseInt(body.amount) }
        }
      });
      return NextResponse.json(updated);
    }

    // Option B: CREATE NEW ITEM
    // --- 1. DATA SANITIZATION ---
    // Map various frontend field names to our Schema
    const name = body.productName || body.name;
    const price = parseFloat(body.priceGHS || body.price || body.sellingPrice || '0');
    const cost = parseFloat(body.buyingPrice || body.costPrice || '0');
    const qty = parseInt(body.quantity || body.stockLevel || '0');
    const minStock = parseInt(body.minStock || '5');

    // --- 2. VALIDATION ---
    if (!name || isNaN(price)) {
      return NextResponse.json(
        { error: "Product Name and Selling Price are required" },
        { status: 400 }
      );
    }

    // --- 3. BARCODE GENERATION ---
    const barcode = body.sku?.trim() || body.barcode?.trim() || `SKU-${Date.now().toString().slice(-6)}`;

    // --- 4. DUPLICATE CHECK ---
    const existing = await prisma.product.findUnique({ 
      where: { barcode: barcode } 
    });

    if (existing) {
      return NextResponse.json(
        { error: `Product with Barcode/SKU '${barcode}' already exists.` },
        { status: 409 }
      );
    }

    // --- 5. CREATE DATABASE RECORD ---
    const product = await prisma.product.create({
      data: {
        shopId: params.id,
        name: name,
        barcode: barcode,
        sellingPrice: price,
        buyingPrice: cost,
        stockLevel: qty,
        minStock: minStock,
        category: body.category || "GENERAL",
      },
    });

    return NextResponse.json(product);

  } catch (e: any) {
    console.error("❌ INVENTORY_ERROR:", e.message);
    
    if (e.code === 'P2002') {
       return NextResponse.json(
        { error: "A product with this Barcode already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Operation failed" },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------------------
// 3. DELETE: REMOVE INVENTORY ITEM
// ----------------------------------------------------------------------
export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await req.json();
    
    if (!id) return NextResponse.json({ error: "Product ID required" }, { status: 400 });

    await prisma.product.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}