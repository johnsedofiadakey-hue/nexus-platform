import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * 🔐 NEXUS ENROLLMENT ENGINE
 * High-performance operative onboarding for the Nexus Platform.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      name, 
      email, 
      password, 
      role, 
      phone, 
      ghanaCard, 
      dob, 
      shopId, 
      image 
    } = body;

    // 1. DATA VALIDATION: Strict verification of core identity markers
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Incomplete Identity: Name, email, and access key are mandatory." }, 
        { status: 400 }
      );
    }

    // 2. DUPLICATE CHECK: Normalize email to prevent duplicate entries
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Collision Detected: This email is already active in the network." }, 
        { status: 409 }
      );
    }

    // 3. SECURITY: Industrial-grade password hashing (Salt Factor 12)
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4. DATA TRANSFORMATION: Standardize Date for PostgreSQL
    // This logic handles both the ISO string from our frontend and empty inputs.
    let birthDate = null;
    if (dob) {
      const parsedDate = new Date(dob);
      if (!isNaN(parsedDate.getTime())) {
        birthDate = parsedDate;
      }
    }

    // 5. ATOMIC PERSISTENCE: Save Operative to Database
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: role || "WORKER",
        phone: phone || null,
        ghanaCard: ghanaCard || null,
        dob: birthDate,
        image: image || null,
        status: "ACTIVE",
        // Logic to connect to the assigned shop/hub
        shop: shopId ? {
          connect: { id: shopId }
        } : undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        shopId: true,
        shop: {
          select: { name: true }
        }
      }
    });

    console.log(`✅ Uplink Established: ${newUser.name} assigned to hub ${newUser.shop?.name || 'Mobile'}`);

    return NextResponse.json({
      message: "Operative enrolled successfully",
      user: newUser
    }, { status: 201 });

  } catch (error: any) {
    console.error("❌ ENROLLMENT_ENGINE_CRITICAL_FAILURE:", error);
    
    // Handle Prisma specific errors (e.g., trying to save to a field that doesn't exist)
    if (error.name === 'PrismaClientValidationError') {
      return NextResponse.json({ 
        error: "Schema Mismatch: The database does not recognize some provided fields.",
        details: "Action: Run 'npx prisma db push' to sync your database."
      }, { status: 500 });
    }

    // Handle Supabase/Connection Pooler issues
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Duplicate identity data found." }, { status: 400 });
    }

    return NextResponse.json(
      { 
        error: "Database Rejection: System failed to save operative credentials.",
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}