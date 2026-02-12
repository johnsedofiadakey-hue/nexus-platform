import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_ONLY_ROUTES = [
  '/dashboard',
];

const PUBLIC_ROUTES = [
  '/auth/signin',
  '/auth/error',
  '/_next',
  '/api/auth',
  '/api/public',
  '/api/debug-auth',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 2. Get token with custom cookie name
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: process.env.NODE_ENV === 'production'
      ? '__Secure-nexus-admin-session-token'
      : 'nexus-admin-session-token',
  });

  // 3. Require authentication
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const loginUrl = new URL('/auth/signin', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = token.role as string;
  const isAdminRole = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'AUDITOR'].includes(userRole);
  const isPromoterRole = ['WORKER', 'AGENT', 'ASSISTANT'].includes(userRole);

  // 4. Bidirectional Protection
  // Block non-admins from dashboard
  if (pathname.startsWith('/dashboard') && !isAdminRole) {
    const errorUrl = new URL('/auth/signin', request.url);
    errorUrl.searchParams.set('error', 'insufficient_permissions');
    return NextResponse.redirect(errorUrl);
  }

  // Block non-promoters from mobilepos
  if (pathname.startsWith('/mobilepos') && !isPromoterRole) {
    const errorUrl = new URL('/auth/signin', request.url);
    errorUrl.searchParams.set('error', 'insufficient_permissions');
    return NextResponse.redirect(errorUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
