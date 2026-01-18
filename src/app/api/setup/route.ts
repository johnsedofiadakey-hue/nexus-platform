import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs'; // Ensure you have this: npm install bcryptjs

export async function GET() {
  try {
    // 1. Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: "admin@nexus.com" }
    });

    if (existingAdmin) {
      return NextResponse.json({ message: "Admin already exists!", user: existingAdmin });
    }

    // 2. Hash the password (password is 'admin123')
    const hashedPassword = await hash("admin123", 12);

    // 3. Create the Super Admin
    const admin = await prisma.user.create({
      data: {
        name: "System Administrator",
        email: "admin@nexus.com",
        password: hashedPassword,
        role: "SUPER_USER",
        status: "ACTIVE",
        // Dummy GPS data so the map doesn't crash on first load
        lastLat: 5.6037, 
        lastLng: -0.1870,
        lastSync: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Admin created successfully", 
      credentials: {
        email: "admin@nexus.com",
        password: "admin123"
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}