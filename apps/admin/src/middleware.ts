import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * 🛡️ SERVER-SIDE MIDDLEWARE FOR ROUTE PROTECTION
 * Validates authentication and authorization BEFORE routes load
 */

// Routes that require specific roles
const PROTECTED_ROUTES: Record<string, string[]> = {
  '/dashboard': ['ADMIN', 'MANAGER', 'SUPER_ADMIN'],
  '/staff': ['ADMIN', 'MANAGER', 'SUPER_ADMIN', 'WORKER', 'AGENT', 'ASSISTANT'],
  '/stats': ['ADMIN', 'MANAGER', 'SUPER_ADMIN'],
  '/settings': ['ADMIN', 'MANAGER', 'SUPER_ADMIN'],
  '/operations': ['ADMIN', 'MANAGER', 'SUPER_ADMIN'],
  '/analytics': ['ADMIN', 'MANAGER', 'SUPER_ADMIN'],
  '/super-user': ['SUPER_ADMIN'],
  '/audit': ['SUPER_ADMIN'],
};

// Public routes (no auth required)
const PUBLIC_ROUTES = [
  '/auth/signin',
  '/auth/error',
  '/_next',
  '/api/auth', // NextAuth API routes MUST be public
  '/api/public',
];

// API routes with role protection
const PROTECTED_API_ROUTES: Record<string, string[]> = {
  '/api/super': ['SUPER_ADMIN'],
  '/api/admin': ['ADMIN', 'MANAGER', 'SUPER_ADMIN'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public routes without authentication
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 2. Get JWT token from request
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // 3. If no token, redirect to signin
  if (!token) {
    // ✅ FIX: Return JSON for API routes, redirect for pages
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Store the requested URL for post-login redirect
    const callbackUrl = pathname;
    const loginUrl = new URL('/auth/signin', request.url);
    loginUrl.searchParams.set('callbackUrl', callbackUrl);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = token.role as string;

  // 4. Check page routes
  for (const [route, allowedRoles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(route)) {
      if (!allowedRoles.includes(userRole)) {
        // ✅ Return 403 error instead of silently redirecting
        return NextResponse.redirect(new URL('/auth/error?error=unauthorized', request.url));
      }
    }
  }

  // 5. Check API routes
  for (const [route, allowedRoles] of Object.entries(PROTECTED_API_ROUTES)) {
    if (pathname.startsWith(route)) {
      if (!allowedRoles.includes(userRole)) {
        return NextResponse.json(
          { error: "Forbidden: Insufficient permissions" },
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
  }

  // 6. Check for agent-only trying to access admin portal
  const isAgentRole = ['WORKER', 'AGENT', 'ASSISTANT'].includes(userRole);
  if (isAgentRole && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/error?error=agent_cannot_access_admin', request.url));
  }

  // 7. Allow request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
