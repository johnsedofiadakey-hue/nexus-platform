import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * Environment Check API
 * This endpoint helps diagnose deployment issues
 * DO NOT enable in production for security reasons
 */
export async function GET() {
  // Only run in development or if explicitly enabled
  const isDevMode = process.env.NODE_ENV === 'development';
  const enableCheck = process.env.ENABLE_ENV_CHECK === 'true';

  if (!isDevMode && !enableCheck) {
    return NextResponse.json(
      { error: "Environment check disabled in production" },
      { status: 403 }
    );
  }

  const checks = {
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    DATABASE_URL: !!process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL_VALUE: process.env.NEXTAUTH_URL || 'NOT SET',
  };

  return NextResponse.json({
    status: checks.NEXTAUTH_SECRET && checks.DATABASE_URL ? 'OK' : 'MISSING_VARS',
    checks,
    message: checks.NEXTAUTH_SECRET && checks.DATABASE_URL 
      ? 'All required environment variables are set' 
      : 'Missing required environment variables. Check Vercel dashboard.',
  });
}
