import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * 🔐 NEXUS ENROLLMENT ENGINE
 * Handles secure onboarding for Stormglide and Glasstech operatives.
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

    // 1. DATA VALIDATION: Explicitly check for password presence
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Name, email, and password are required for enrollment." }, 
        { status: 400 }
      );
    }

    // 2. DUPLICATE CHECK: Normalize email to prevent ghost accounts
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "This email is already registered in the system." }, 
        { status: 409 }
      );
    }

    // 3. SECURITY: High-standard salt factor for the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4. DATA TRANSFORMATION: Date safety for Ghana-specific formats
    const birthDate = dob && !isNaN(Date.parse(dob)) ? new Date(dob) : null;

    // 5. ATOMIC PERSISTENCE
    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role || "SALES_REP",
        phone: phone || null,
        ghanaCard: ghanaCard || null,
        dob: birthDate,
        image: image || null,
        status: "ACTIVE",
        // Linking to Stormglide or Glasstech hubs
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
        shopId: true, // Needed for ProfileCard matching
        shop: {
          select: { name: true }
        }
      }
    });

    console.log(`✅ Success: ${newUser.name} enrolled as ${newUser.role}`);

    return NextResponse.json({
      message: "Member added successfully",
      user: newUser
    }, { status: 201 });

  } catch (error: any) {
    console.error("Enrollment Failure:", error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Email already in use." }, { status: 400 });
    }

    return NextResponse.json(
      { error: "System failed to save member. Please try again." }, 
      { status: 500 }
    );
  }
}