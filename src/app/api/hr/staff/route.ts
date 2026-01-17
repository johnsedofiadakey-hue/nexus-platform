import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs"; 

// Force dynamic to ensure the list is always fresh
export const dynamic = 'force-dynamic';

// GET: List all staff (Excluding Super Admins)
export async function GET() {
  try {
    const staff = await prisma.user.findMany({
      where: {
        role: { not: "SUPER_USER" } // Hide Super Admin from the general list
      },
      include: {
        shop: { select: { name: true, location: true } }, // Include Shop Details
        _count: { select: { sales: true } } // Include Sales Count
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Remove passwords before sending to frontend
    const safeStaff = staff.map(user => {
      const { password, ...rest } = user;
      return rest;
    });

    return NextResponse.json(safeStaff);
  } catch (error) {
    console.error("Fetch Staff Error:", error);
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}

// POST: Enroll new staff
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role, phone, shopId, status } = body;

    // 1. Check if email exists
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    // 2. Hash Password
    const hashedPassword = await hash(password, 10);

    // 3. Create User
    // We convert empty strings to null for optional fields like shopId
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "SALES_REP",
        phone,
        // If shopId is an empty string, set it to null, otherwise use the ID
        shopId: shopId === "" ? null : shopId,
        status: status || "ACTIVE"
      }
    });

    // Return user without password
    const { password: _, ...safeUser } = user;
    return NextResponse.json(safeUser);

  } catch (error) {
    console.error("Enrollment Error:", error);
    return NextResponse.json({ error: "Failed to enroll staff" }, { status: 500 });
  }
}