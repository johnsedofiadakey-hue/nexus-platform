import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

export const dynamic = 'force-dynamic';

/**
 * Temporary auth debug endpoint - tests DB connection and password verification
 * DELETE THIS BEFORE FINAL PRODUCTION
 */
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    // Test 1: Check environment
    const envCheck = {
      hasDbUrl: !!process.env.DATABASE_URL,
      dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + "...",
      hasSecret: !!process.env.NEXTAUTH_SECRET,
      nextauthUrl: process.env.NEXTAUTH_URL,
      nodeEnv: process.env.NODE_ENV,
    };

    // Test 2: Try to find user
    let userFound = false;
    let userRole = "";
    let passwordMatch = false;
    let dbError = "";
    let hashPrefix = "";

    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: { id: true, email: true, password: true, role: true }
      });

      if (user) {
        userFound = true;
        userRole = user.role;
        hashPrefix = user.password.substring(0, 10) + "...";
        passwordMatch = await compare(password, user.password);
      }
    } catch (e: any) {
      dbError = e.message?.substring(0, 200) || "Unknown DB error";
    }

    return NextResponse.json({
      envCheck,
      userFound,
      userRole,
      hashPrefix,
      passwordMatch,
      dbError: dbError || null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
