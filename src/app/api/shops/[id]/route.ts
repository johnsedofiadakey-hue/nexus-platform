import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ----------------------------------------------------------------------
// 1. GET: FETCH SHOP & INVENTORY
// ----------------------------------------------------------------------
export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;

  try {
    const shop = await prisma.shop.findUnique({
      where: { id },
      include: {
        users: { 
          select: { id: true, name: true, role: true } 
        },
        products: { 
          orderBy: { updatedAt: 'desc' } 
        } 
      }
    });

    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    // 🧠 MAPPING: Match Frontend Expectations
    const response = {
      ...shop,
      staff: shop.users,       
      inventory: shop.products 
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error("GET Shop Error:", error);
    return NextResponse.json({ error: "Sync Error" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// 2. POST: INVENTORY ACTIONS (CREATE & UPDATE)
// ----------------------------------------------------------------------
export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;

  try {
    const body = await req.json();
    console.log(`\n📦 INVENTORY ACTION [Shop: ${id}]`, body);

    // --- SHARED DATA SANITIZATION ---
    const price = parseFloat(body.priceGHS || body.price || '0');
    const qty = parseInt(body.quantity || body.stockLevel || '0');
    const minLevel = parseInt(body.minStock || '5');
    const productName = body.productName || body.name;
    const subCat = body.subCategory || "Unsorted";
    
    // 🆕 NEW FIELDS (Model & Specs)
    const modelNum = body.modelNumber || ""; 
    const desc = body.description || body.notes || ""; 

    if (isNaN(price) || !productName) {
      return NextResponse.json({ error: "Invalid Price or Name" }, { status: 400 });
    }

    // ======================================================
    // 🅰️ UPDATE MODE (Editing Existing Stock)
    // ======================================================
    if (body.id) {
      console.log(`🔄 UPDATING ITEM: ${body.id}`);
      
      const updatedItem = await prisma.product.update({
        where: { id: body.id },
        data: {
          name: productName,
          modelNumber: modelNum,      // 👈 SAVING UPDATE
          description: desc,          // 👈 SAVING UPDATE
          barcode: body.sku,
          sellingPrice: price,
          stockLevel: qty,
          minStock: minLevel,
          category: body.category || "General",
          subCategory: subCat,
        }
      });

      return NextResponse.json({ 
        success: true, 
        data: updatedItem,
        message: "Inventory Updated",
        audit: { date: updatedItem.updatedAt, newTotal: updatedItem.stockLevel }
      });
    }

    // ======================================================
    // 🅱️ CREATE MODE (Adding New Stock)
    // ======================================================
    console.log(`✨ CREATING NEW ITEM`);

    const finalBarcode = body.sku && body.sku.length > 2 
      ? body.sku 
      : `SKU-${Date.now().toString().slice(-6)}`;

    // Check for duplicates
    const existing = await prisma.product.findFirst({ 
      where: { barcode: finalBarcode } 
    });
    
    if (existing) {
      return NextResponse.json({ error: `Barcode ${finalBarcode} already exists.` }, { status: 409 });
    }

    const newItem = await prisma.product.create({
      data: {
        shopId: id,
        name: productName,
        modelNumber: modelNum,      // 👈 SAVING NEW
        description: desc,          // 👈 SAVING NEW
        barcode: finalBarcode,
        sellingPrice: price,
        buyingPrice: 0,
        stockLevel: qty,
        minStock: minLevel,
        category: body.category || "General",
        subCategory: subCat,
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: newItem,
      message: "Item Added",
      audit: { date: newItem.createdAt, qtyAdded: newItem.stockLevel }
    });

  } catch (error: any) {
    console.error("❌ TRANSACTION FAILED:", error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "This Barcode/SKU is already taken." }, { status: 409 });
    }
    
    return NextResponse.json({ error: error.message || "Database Error" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// 3. DELETE: UNIVERSAL REMOVAL (SHOP OR INVENTORY)
// ----------------------------------------------------------------------
export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;

  try {
    let body = null;
    try {
      const text = await req.text();
      body = text ? JSON.parse(text) : null;
    } catch (e) {
      // Ignore parse error
    }

    // === SCENARIO A: DELETE INVENTORY ITEM ===
    if (body && body.type === 'INVENTORY' && body.id) {
      console.log(`🗑️ DELETING STOCK ITEM: ${body.id}`);
      await prisma.product.delete({ where: { id: body.id } });
      return NextResponse.json({ success: true, message: "Item deleted" });
    }

    // === SCENARIO B: DELETE ENTIRE SHOP ===
    console.log(`🔥 DELETING SHOP: ${id}`);

    // 🛡️ Transactional Cleanup (Sales FIRST to prevent Foreign Key errors)
    await prisma.$transaction([
      prisma.sale.deleteMany({ where: { shopId: id } }),
      prisma.expense.deleteMany({ where: { shopId: id } }),
      prisma.customer.deleteMany({ where: { shopId: id } }),
      prisma.product.deleteMany({ where: { shopId: id } }),
      prisma.user.updateMany({
        where: { shopId: id },
        data: { shopId: null }
      }),
      prisma.shop.delete({ where: { id } })
    ]);

    return NextResponse.json({ success: true, message: "Shop and all related data purged." });

  } catch (error: any) {
    console.error("❌ DELETE FAILED:", error);
    return NextResponse.json({ error: "Delete operation failed." }, { status: 500 });
  }
}