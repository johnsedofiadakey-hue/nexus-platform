import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch the Taxonomy Tree
export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const categories = await prisma.inventoryCategory.findMany({
    where: { shopId: id },
    include: { subCategories: true },
    orderBy: { name: 'asc' }
  });
  return NextResponse.json(categories);
}

// POST: Add Category or Subcategory
export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const body = await req.json();

  try {
    if (!body.name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    // 1. Add Subcategory (if parentId exists)
    if (body.parentId) {
      const sub = await prisma.inventorySubCategory.create({
        data: { name: body.name, categoryId: body.parentId }
      });
      return NextResponse.json(sub);
    } 
    
    // 2. Add Main Category
    const cat = await prisma.inventoryCategory.create({
      data: { name: body.name, shopId: id }
    });
    return NextResponse.json(cat);

  } catch (e) {
    return NextResponse.json({ error: "Failed to save category" }, { status: 500 });
  }
}

// DELETE: Remove Category
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    if (body.isSub) {
      await prisma.inventorySubCategory.delete({ where: { id: body.id } });
    } else {
      await prisma.inventoryCategory.delete({ where: { id: body.id } });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}