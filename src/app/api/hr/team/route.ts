import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET: List all users in Organization who have "Access" (Not just WORKER)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const users = await prisma.user.findMany({
      where: {
        role: { in: ['SUPER_ADMIN', 'ADMIN', 'ASSISTANT', 'AUDITOR'] },
        // organizationId: session.user.organizationId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastSeen: true,
        permissions: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

// POST: Invite/Create New Admin/Assistant
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    // Check Permissions (Only ADMIN/SUPER_ADMIN can invite)
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
         return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role, permissions } = body;

    if (!email || !password || !name) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user exists
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: "Email already in use" }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
        data: {
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role || 'ASSISTANT',
            permissions: permissions || [], 
            organizationId: session.user.organizationId,
            status: 'ACTIVE'
        }
    });

    return NextResponse.json(newUser);

  } catch (error) {
    console.error("Invite Error:", error);
    return NextResponse.json({ error: "Invite Failed" }, { status: 500 });
  }
}

// DELETE: Remove Access
export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
