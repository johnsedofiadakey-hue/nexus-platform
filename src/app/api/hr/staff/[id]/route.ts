import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export const dynamic = 'force-dynamic';

// GET: Fetch Single User Details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const userId = resolvedParams.id;

    if (!userId) {
      return NextResponse.json({ error: "Invalid ID provided" }, { status: 400 });
    }

    // 1. Fetch User Data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        shop: { 
          select: { 
            id: true, 
            name: true, 
            location: true, 
            managerName: true, 
            managerPhone: true, 
            openingTime: true 
          } 
        },
        _count: {
          select: { sales: true, conductIncidents: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Safely Calculate Total Revenue
    let totalRevenue = 0;
    try {
      const revenueAgg = await prisma.sale.aggregate({
        where: { userId: user.id },
        _sum: { totalAmount: true }
      });
      totalRevenue = revenueAgg._sum.totalAmount || 0;
    } catch (aggError) {
      console.warn("Sales aggregation skipped (table might be empty)");
    }

    // 3. Remove Password for Security
    const { password, ...safeUser } = user;

    return NextResponse.json({
      ...safeUser,
      totalRevenue
    });

  } catch (error: any) {
    console.error("[API GET ERROR]:", error);
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}

// PATCH: Update User Details & Password
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    
    console.log(`[API] Updating Staff ID: ${resolvedParams.id}`);

    const { name, email, phone, role, status, assignedShopId, password } = body;

    // Prepare update data
    const dataToUpdate: any = {
      name,
      email,
      phone,
      role,
      status,
      // Logic: If assignedShopId is missing or empty, set database field to NULL
      shopId: assignedShopId && assignedShopId.trim() !== "" ? assignedShopId : null
    };

    // ✅ PASSWORD LOGIC: Only hash and update if a new password was actually typed
    if (password && password.trim().length > 0) {
      dataToUpdate.password = await hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: resolvedParams.id },
      data: dataToUpdate
    });

    // Remove password from response
    const { password: _, ...safeUser } = updatedUser;
    
    return NextResponse.json(safeUser);

  } catch (error: any) {
    console.error("[API PATCH ERROR]:", error);
    return NextResponse.json({ error: error.message || "Update Failed" }, { status: 500 });
  }
}

// DELETE: Remove User
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    
    console.log(`[API] Deleting Staff ID: ${resolvedParams.id}`);

    await prisma.user.delete({
      where: { id: resolvedParams.id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[API DELETE ERROR]:", error);
    return NextResponse.json({ error: error.message || "Delete Failed" }, { status: 500 });
  }
}