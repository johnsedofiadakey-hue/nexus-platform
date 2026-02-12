import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for API routes that use database
export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// GET: Fetch the Taxonomy Tree
export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  // 🛡️ SECURITY: Allow if Super Admin OR if belongs to Organization
  const isSuper = (session.user as any).role === 'SUPER_ADMIN';
  if (!isSuper && !session.user.organizationId) {
    return NextResponse.json([], { status: 401 });
  }

  const shopQuery = isSuper ? { id } : { id, organizationId: session.user.organizationId };

  const shop = await prisma.shop.findFirst({ where: shopQuery });
  if (!shop) return NextResponse.json([], { status: 403 });

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

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSuper = (session.user as any).role === 'SUPER_ADMIN';
  if (!isSuper && !session.user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shopQuery = isSuper ? { id } : { id, organizationId: session.user.organizationId };
  const shop = await prisma.shop.findFirst({ where: shopQuery });

  if (!shop) return NextResponse.json({ error: "Access Denied" }, { status: 403 });

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
    // Note: This endpoint is general, but validation is hard without shopId in URL or body.
    // The frontend sends { id, isSub }. 
    // Ideally we should check if the category belongs to a shop owned by the user.
    // Given the previous pattern, we might need to fetch the category to see its shopId.

    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    // 🔒 Security: Verify category belongs to user's organization
    if (body.isSub) {
      const subCategory = await prisma.inventorySubCategory.findUnique({
        where: { id: body.id },
        include: { category: { include: { shop: true } } }
      });
      if (!subCategory || subCategory.category.shop.organizationId !== session.user.organizationId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      await prisma.inventorySubCategory.delete({ where: { id: body.id } });
    } else {
      const category = await prisma.inventoryCategory.findUnique({
        where: { id: body.id },
        include: { shop: true }
      });
      if (!category || category.shop.organizationId !== session.user.organizationId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      await prisma.inventoryCategory.delete({ where: { id: body.id } });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}