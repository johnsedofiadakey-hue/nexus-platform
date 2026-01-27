import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ---------------- GET INVENTORY ----------------
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const products = await prisma.product.findMany({
    where: { shopId: params.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

// ---------------- ADD INVENTORY ----------------
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const price = Number(body.priceGHS);
    const quantity = Number(body.quantity || 0);

    if (!body.productName || isNaN(price)) {
      return NextResponse.json(
        { error: "Invalid product payload" },
        { status: 400 }
      );
    }

    const sku =
      body.sku?.trim() ||
      `SKU-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;

    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) {
      return NextResponse.json(
        { error: "SKU already exists" },
        { status: 409 }
      );
    }

    const product = await prisma.product.create({
      data: {
        shopId: params.id,
        productName: body.productName,
        sku,
        priceGHS: price,
        quantity,
        minStock: 5,
        category: "General",
        subCat: "Unsorted",
        formulation: "FINISHED_GOOD",
      },
    });

    return NextResponse.json(product);
  } catch (e: any) {
    console.error("❌ INVENTORY_CREATE:", e.message);
    return NextResponse.json(
      { error: "Inventory save failed" },
      { status: 500 }
    );
  }
}

// ---------------- DELETE INVENTORY ----------------
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await req.json();
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}
