import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * 🛡️ AGENT APP MIDDLEWARE - Route Protection
 * Ensures only WORKER/AGENT/ASSISTANT roles can access mobile POS
 */

const AGENT_ONLY_ROUTES = [
  '/mobilepos',
];

const SUPER_ADMIN_BLOCKED_ROUTES = [
  '/mobilepos', // SUPER_ADMIN should not use field agent portal
];

const PUBLIC_ROUTES = [
  '/auth/signin',
  '/auth/error',
  '/_next',
  '/api/public',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 2. Get token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // 3. Require authentication
  if (!token) {
    const loginUrl = new URL('/auth/signin', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = token.role as string;

  // 4. Protect agent-only routes
  for (const route of AGENT_ONLY_ROUTES) {
    if (pathname.startsWith(route)) {
      const isAgentRole = ['WORKER', 'AGENT', 'ASSISTANT'].includes(userRole);
      
      if (!isAgentRole) {
        return NextResponse.redirect(new URL('/auth/error?error=admin_cannot_use_agent_portal', request.url));
      }
    }
  }

  // 5. Prevent SUPER_ADMIN from accessing mobile POS
  if (userRole === 'SUPER_ADMIN') {
    for (const route of SUPER_ADMIN_BLOCKED_ROUTES) {
      if (pathname.startsWith(route)) {
        return NextResponse.redirect(new URL('/auth/signin?error=super_admin_use_admin_portal', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
