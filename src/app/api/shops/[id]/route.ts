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
        staff: { select: { id: true, name: true, role: true } },
        inventory: { orderBy: { updatedAt: 'desc' } } // Sort by most recently touched
      }
    });

    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    return NextResponse.json(shop);

  } catch (error: any) {
    return NextResponse.json({ error: "Sync Error" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// 2. POST: SMART INVENTORY HANDLER (CREATE & UPDATE)
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
    const price = parseFloat(body.priceGHS);
    const qty = parseInt(body.quantity);
    const minLevel = parseInt(body.minStock);

    if (isNaN(price)) return NextResponse.json({ error: "Invalid Price" }, { status: 400 });

    // ======================================================
    // 🅰️ UPDATE MODE (Editing Existing Stock)
    // ======================================================
    if (body.id) {
      console.log(`🔄 UPDATING ITEM: ${body.id}`);
      
      // Calculate movement (Optional: for advanced logging)
      // For now, we overwrite with the new "Total Count" from the UI
      
      const updatedItem = await prisma.product.update({
        where: { id: body.id },
        data: {
          productName: body.productName,
          sku: body.sku,
          priceGHS: price,
          quantity: qty, // Updates to the new total
          minStock: isNaN(minLevel) ? 5 : minLevel,
          category: body.category,
          subCat: body.subCategory
        }
      });

      return NextResponse.json({ 
        success: true, 
        data: updatedItem,
        message: "Inventory Updated",
        audit: {
          date: updatedItem.updatedAt,
          newTotal: updatedItem.quantity
        }
      });
    }

    // ======================================================
    // 🅱️ CREATE MODE (Adding New Stock)
    // ======================================================
    console.log(`✨ CREATING NEW ITEM`);

    const finalSku = body.sku && body.sku.length > 2 
      ? body.sku 
      : `SKU-${Date.now().toString().slice(-6)}`;

    // Duplicate Check
    const existing = await prisma.product.findUnique({ where: { sku: finalSku } });
    if (existing) {
      return NextResponse.json({ error: `SKU ${finalSku} is already in use.` }, { status: 409 });
    }

    const newItem = await prisma.product.create({
      data: {
        shopId: id,
        productName: body.productName,
        sku: finalSku,
        priceGHS: price,
        quantity: isNaN(qty) ? 0 : qty,
        minStock: isNaN(minLevel) ? 5 : minLevel,
        category: body.category || "General",
        subCat: body.subCategory || "Unsorted",
        formulation: "FINISHED_GOOD"
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: newItem,
      message: "Item Added",
      audit: {
        date: newItem.createdAt,
        qtyAdded: newItem.quantity
      }
    });

  } catch (error: any) {
    console.error("❌ TRANSACTION FAILED:", error);
    
    // Friendly error for duplicates during Edit
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "This SKU is already taken by another item." }, { status: 409 });
    }
    
    return NextResponse.json({ error: error.message || "Database Error" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// 3. DELETE: REMOVE ITEM
// ----------------------------------------------------------------------
export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "ID Required" }, { status: 400 });

    await prisma.product.delete({ where: { id: body.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Delete Failed" }, { status: 500 });
  }
}