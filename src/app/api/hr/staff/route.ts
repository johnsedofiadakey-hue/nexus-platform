import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs"; 

export const dynamic = 'force-dynamic';

// GET: List all staff
export async function GET() {
  try {
    const staff = await prisma.user.findMany({
      where: { role: { not: "SUPER_USER" } },
      include: {
        shop: { select: { name: true, location: true } },
        _count: { select: { sales: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const safeStaff = staff.map(({ password, ...rest }) => rest);
    return NextResponse.json(safeStaff);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}

// POST: Enroll new staff
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role, phone, shopId, status } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Check duplicate email
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: "Email already in use" }, { status: 400 });

    // 2. Validate Shop (If provided)
    let validShopId = null;
    if (shopId && shopId !== "") {
      const shopExists = await prisma.shop.findUnique({ where: { id: shopId } });
      if (!shopExists) return NextResponse.json({ error: "Invalid Shop ID" }, { status: 400 });
      validShopId = shopId;
    }

    // 3. Create User
    const hashedPassword = await hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "SALES_REP",
        phone,
        shopId: validShopId, // Safe ID
        status: status || "ACTIVE"
      }
    });

    const { password: _, ...safeUser } = user;
    return NextResponse.json(safeUser);

  } catch (error) {
    console.error("Enrollment Error:", error);
    return NextResponse.json({ error: "Failed to enroll staff" }, { status: 500 });
  }
}