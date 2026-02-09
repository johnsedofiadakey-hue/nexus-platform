import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for API routes that use database
export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { logActivity, getClientIp, getUserAgent } from "@/lib/activity-logger";

// ----------------------------------------------------------------------
// 1. GET: FETCH SHOP & INVENTORY
// ----------------------------------------------------------------------
export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuper = (session.user as any).role === 'SUPER_ADMIN';
    if (!isSuper && !session.user.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shopQuery = isSuper ? { id } : { id, organizationId: session.user.organizationId };

    const shop = await prisma.shop.findFirst({
      where: shopQuery,
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
    return NextResponse.json({ error: "Sync Error" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// 1.5 PATCH: UPDATE SHOP DETAILS
// ----------------------------------------------------------------------
export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, location, managerName, managerContact, radius, latitude, longitude } = body;

    const shop = await prisma.shop.update({
      where: { id },
      data: {
        name,
        location,
        managerName,
        managerContact,
        radius: radius ? parseInt(radius) : undefined,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
      }
    });

    // 📊 Log Activity
    await logActivity({
      userId: session.user.id,
      userName: session.user.name || "Unknown",
      userRole: (session.user as any).role || "USER",
      action: "SHOP_UPDATED",
      entity: "Shop",
      entityId: id,
      description: `Updated shop details for "${name || shop.name}"`,
      metadata: { shopId: id, changes: { name, location, managerName, managerContact, radius } },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      shopId: id,
      shopName: name || shop.name
    });

    return NextResponse.json({ success: true, data: shop });
  } catch (error: any) {
    console.error("❌ SHOP_UPDATE_ERROR:", error);
    return NextResponse.json({ error: "Failed to update shop" }, { status: 500 });
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
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuper = (session.user as any).role === 'SUPER_ADMIN';
    if (!isSuper && !session.user.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership of the shop first
    const shopQuery = isSuper ? { id } : { id, organizationId: session.user.organizationId };
    const shopOwner = await prisma.shop.findFirst({ where: shopQuery });

    if (!shopOwner) return NextResponse.json({ error: "Shop not found or access denied" }, { status: 403 });

    const body = await req.json();
    console.log(`\n📦 INVENTORY ACTION [Shop: ${id}]`, body);

    // 🕵️ AUDIT LOGGING DATA
    const reason = body.reason || "MANUAL_UPDATE";
    const userId = session.user.id;

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
          modelNumber: modelNum,
          description: desc,
          barcode: body.sku,
          sellingPrice: price,
          stockLevel: qty,
          minStock: minLevel,
          category: body.category || "General",
          subCategory: subCat,
        }
      });

      // 📝 LOG AUDIT
      await prisma.auditLog.create({
        data: {
          userId,
          action: "UPDATE_STOCK",
          entity: "Product",
          entityId: updatedItem.id,
          details: JSON.stringify({ reason, oldStock: '?', newStock: qty, price })
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
      where: { barcode: finalBarcode, shopId: id } // Scope to shop!
    });

    if (existing) {
      return NextResponse.json({ error: `Barcode ${finalBarcode} already exists.` }, { status: 409 });
    }

    const newItem = await prisma.product.create({
      data: {
        shopId: id,
        name: productName,
        modelNumber: modelNum,
        description: desc,
        barcode: finalBarcode,
        sellingPrice: price,
        buyingPrice: 0, // Default
        stockLevel: qty,
        minStock: minLevel,
        category: body.category || "General",
        subCategory: subCat,
      }
    });

    // 📝 LOG AUDIT FOR CREATION
    await prisma.auditLog.create({
      data: {
        userId,
        action: "CREATE_stock",
        entity: "Product",
        entityId: newItem.id,
        details: JSON.stringify({ reason: "INITIAL_STOCK", qty, price })
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
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership of the shop first
    const shopOwner = await prisma.shop.findFirst({
      where: { id, organizationId: session.user.organizationId }
    });
    if (!shopOwner) return NextResponse.json({ error: "Access denied" }, { status: 403 });

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
      // Ensure product belongs to this shop
      const product = await prisma.product.findFirst({ where: { id: body.id, shopId: id } })
      if (!product) return NextResponse.json({ error: "Item not found in this shop" }, { status: 404 });

      await prisma.product.delete({ where: { id: body.id } });

      // 📊 Log Activity
      await logActivity({
        userId: session.user.id,
        userName: session.user.name || "Unknown",
        userRole: (session.user as any).role || "USER",
        action: "PRODUCT_DELETED",
        entity: "Product",
        entityId: body.id,
        description: `Deleted product "${product.name}" from inventory`,
        metadata: { productId: body.id, productName: product.name },
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        shopId: id,
        shopName: shopOwner.name
      });

      return NextResponse.json({ success: true, message: "Item deleted" });
    }

    // === SCENARIO B: DELETE ENTIRE SHOP ===
    console.log(`🔥 DELETING SHOP: ${id}`);

    // 🛡️ Transactional Cleanup
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
    // 📊 Log Activity
    await logActivity({
      userId: session.user.id,
      userName: session.user.name || "Unknown",
      userRole: (session.user as any).role || "USER",
      action: "SHOP_DELETED",
      entity: "Shop",
      entityId: id,
      description: `Deleted shop "${shopOwner.name}" and all associated data`,
      metadata: { shopId: id, shopName: shopOwner.name },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      shopId: id,
      shopName: shopOwner.name
    });
    return NextResponse.json({ success: true, message: "Shop and all related data purged." });

  } catch (error: any) {
    console.error("❌ DELETE FAILED:", error);
    return NextResponse.json({ error: "Delete operation failed." }, { status: 500 });
  }
}