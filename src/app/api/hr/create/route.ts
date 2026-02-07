import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireAuth, handleApiError } from "@/lib/auth-helpers";

/**
 * 🔐 NEXUS ENROLLMENT ENGINE
 * High-performance operative onboarding for the Nexus Platform.
 * 🔒 SECURED: Enforces authentication and multi-tenancy isolation
 */
export async function POST(req: Request) {
  try {
    // 🔐 Require authentication
    const user = await requireAuth();

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
      image,
      // Banking & Statutory
      bankAccountName,
      bankName,
      bankAccountNumber,
      ssnitNumber,
      commencementDate
    } = body;

    // 🏆 Determine Target Organization
    // If shopId is provided, the user MUST belong to that shop's organization.
    // Otherwise, they belong to the creator's organization.
    let targetOrgId = user.organizationId;

    if (shopId) {
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        select: { organizationId: true }
      });

      if (!shop) {
        return NextResponse.json({ error: "Operational Hub not found." }, { status: 404 });
      }

      // Security: Creator must either be a Super Admin or belong to the same organization as the shop
      if (user.role !== "SUPER_ADMIN" && shop.organizationId !== user.organizationId) {
        return NextResponse.json({ error: "Access Denied: You do not have authority over this hub." }, { status: 403 });
      }

      targetOrgId = shop.organizationId;
    }

    if (!targetOrgId) {
      return NextResponse.json({ error: "Organization Context Required: Please assign a hub or ensure your profile is linked to an organization." }, { status: 400 });
    }

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
    let birthDate = null;
    if (dob) {
      const parsedDate = new Date(dob);
      if (!isNaN(parsedDate.getTime())) {
        birthDate = parsedDate;
      }
    }

    let commDate = null;
    if (commencementDate) {
      const parsedDate = new Date(commencementDate);
      if (!isNaN(parsedDate.getTime())) {
        commDate = parsedDate;
      }
    }

    // 5. ATOMIC PERSISTENCE: Save Operative to Database
    const newUser = await prisma.user.create({
      data: {
        organization: { connect: { id: targetOrgId } }, // 🔐 TENANT LINK
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: role || "WORKER",
        phone: phone || null,
        ghanaCard: ghanaCard || null,
        dob: birthDate,
        image: image || null,

        // Banking & Statutory
        bankAccountName: bankAccountName || null,
        bankName: bankName || null,
        bankAccountNumber: bankAccountNumber || null,
        ssnitNumber: ssnitNumber || null,
        commencementDate: commDate,

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

    // Check for auth errors
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return handleApiError(error);
    }

    if (error.name === 'PrismaClientValidationError') {
      return NextResponse.json({
        error: "Schema Mismatch: The database does not recognize some provided fields.",
        details: "Action: Run 'npx prisma db push' to sync your database."
      }, { status: 500 });
    }

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