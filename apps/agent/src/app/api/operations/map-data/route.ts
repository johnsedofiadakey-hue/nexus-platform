import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for API routes that use database
export const dynamic = 'force-dynamic';
import { requireAuth } from "@/lib/auth-helpers";

export async function GET() {
  try {
    // 🔐 Require authentication
    const user = await requireAuth();
    
    // 🏢 Build organization filter
    const orgFilter = user.role === "SUPER_ADMIN" && !user.organizationId
      ? {} // Super admin sees all
      : { organizationId: user.organizationId };

    const data = await prisma.shop.findMany({
      where: orgFilter,
      include: {
        sales: true,
        _count: { select: { users: true } }
      }
    }) || []; // Fallback to empty array

    const formatted = data.map(node => ({
      id: node.id,
      name: node.name,
      lat: node.latitude,
      lng: node.longitude,
      sales: node.sales?.reduce((acc, s) => acc + s.totalAmount, 0) || 0,
      staffCount: node._count.users || 0
    }));

    return NextResponse.json(formatted);
  } catch (e) {
    return NextResponse.json([], { status: 200 }); // Return empty array on error to keep UI alive
  }
}