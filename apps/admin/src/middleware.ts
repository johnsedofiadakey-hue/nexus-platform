import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { checkSlidingWindow } from "@/lib/platform/rate-limit";

const ADMIN_ONLY_ROUTES = [
  '/dashboard',
];

const PUBLIC_ROUTES = [
  '/auth/signin',
  '/auth/error',
  '/_next',
  '/api/auth',
  '/api/public',
  '/api/platform/enforcement',
];

const BILLING_ALLOWED_PREFIXES = ['/dashboard/settings', '/dashboard/billing', '/api/payments'];
const ENFORCEMENT_TIMEOUT_MS = 1500;

export function shouldBlockForReadOnly(params: {
  pathname: string;
  method: string;
  systemReadOnly: boolean;
}): boolean {
  if (!params.systemReadOnly) {
    return false;
  }

  const isWriteMethod = !['GET', 'HEAD', 'OPTIONS'].includes(params.method.toUpperCase());
  if (!isWriteMethod) {
    return false;
  }

  return !isBillingAllowedPath(params.pathname);
}

function isBillingAllowedPath(pathname: string): boolean {
  return BILLING_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function featureKeyForPath(pathname: string): string | null {
  if (pathname.startsWith('/api/messages') || pathname.startsWith('/api/mobile/messages')) return 'messaging';
  if (pathname.startsWith('/api/mobile/location') || pathname.startsWith('/api/mobile/pulse')) return 'gps-tracking';
  if (pathname.startsWith('/api/analytics')) return 'analytics';
  if (pathname.startsWith('/api/hr')) return 'hr-suite';
  if (pathname.startsWith('/api/mobile')) return 'mobile-pos';
  return null;
}

const SENSITIVE_API_PREFIXES = [
  '/api/auth',
  '/api/mobile/pulse',
  '/api/messages',
  '/api/mobile/messages',
  '/api/sales',
];

function requestIdFromRequest(request: NextRequest): string {
  return request.headers.get('x-request-id') || crypto.randomUUID();
}

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

async function fetchEnforcementPayload(params: {
  request: NextRequest;
  requestId: string;
  featureKey?: string;
}): Promise<any | null> {
  const { request, requestId, featureKey } = params;
  const endpoint = featureKey
    ? `${request.nextUrl.origin}/api/platform/enforcement?featureKey=${encodeURIComponent(featureKey)}`
    : `${request.nextUrl.origin}/api/platform/enforcement`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ENFORCEMENT_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        cookie: request.headers.get('cookie') || '',
        'x-request-id': requestId,
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = requestIdFromRequest(request);

  const responseWithRequestId = NextResponse.next();
  responseWithRequestId.headers.set('x-request-id', requestId);
  const isBillingRoute = isBillingAllowedPath(pathname);

  if (pathname.startsWith('/api/') && SENSITIVE_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    const ip = clientIp(request);
    const limit = checkSlidingWindow(
      { keyPrefix: 'ip-sensitive', max: 120, windowMs: 60_000 },
      ip
    );

    if (!limit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests',
          },
        },
        {
          status: 429,
          headers: {
            'x-request-id': requestId,
            'retry-after': Math.ceil(limit.retryAfterMs / 1000).toString(),
          },
        }
      );
    }
  }

  // 1. Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return responseWithRequestId;
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
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
        },
        { status: 401, headers: { 'x-request-id': requestId } }
      );
    }

    const loginUrl = new URL('/auth/signin', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = token.role as string;
  const isAdminRole = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'AUDITOR'].includes(userRole);
  const isPromoterRole = ['WORKER', 'AGENT', 'ASSISTANT'].includes(userRole);

  if (!pathname.startsWith('/api/auth') && !pathname.startsWith('/auth')) {
    try {
      const payload = await fetchEnforcementPayload({ request, requestId });
      const enforcement = payload?.data;

      if (enforcement) {

        if (enforcement?.authVersion && Number(token.orgAuthVersion || 1) < Number(enforcement.authVersion || 1)) {
          const loginUrl = new URL('/auth/signin', request.url);
          loginUrl.searchParams.set('error', 'session_invalidated');
          return NextResponse.redirect(loginUrl);
        }

        if (shouldBlockForReadOnly({ pathname, method: request.method, systemReadOnly: Boolean(enforcement?.systemReadOnly) })) {
          if (pathname.startsWith('/api/')) {
            return NextResponse.json(
              {
                success: false,
                error: { code: 'SYSTEM_READ_ONLY', message: 'Platform is currently read-only' },
              },
              { status: 503, headers: { 'x-request-id': requestId } }
            );
          }

          const readOnlyUrl = new URL('/dashboard', request.url);
          readOnlyUrl.searchParams.set('system', 'read-only');
          return NextResponse.redirect(readOnlyUrl);
        }

        if (enforcement?.subscriptionStatus === 'LOCKED' && !isBillingRoute) {
          if (pathname.startsWith('/api/')) {
            return NextResponse.json(
              {
                success: false,
                error: { code: 'SUBSCRIPTION_LOCKED', message: 'Subscription is locked. Visit billing.' },
              },
              { status: 402, headers: { 'x-request-id': requestId } }
            );
          }

          const billingUrl = new URL('/dashboard/settings', request.url);
          billingUrl.searchParams.set('billing', 'locked');
          return NextResponse.redirect(billingUrl);
        }

        if (enforcement?.subscriptionStatus === 'GRACE') {
          responseWithRequestId.headers.set('x-tenant-grace-warning', 'true');
          if (enforcement?.graceEndsAt) {
            responseWithRequestId.headers.set('x-tenant-grace-ends-at', enforcement.graceEndsAt);
          }
        }

        const featureKey = featureKeyForPath(pathname);
        if (featureKey) {
          const featurePayload = await fetchEnforcementPayload({ request, requestId, featureKey });
          if (featurePayload?.data?.featureEnabled === false) {
            return NextResponse.json(
              {
                success: false,
                error: { code: 'FEATURE_DISABLED', message: `Feature '${featureKey}' is not enabled for this tenant` },
              },
              { status: 403, headers: { 'x-request-id': requestId } }
            );
          }
        }
      }
    } catch (enforcementError) {
      // Fail-open intentionally to avoid platform-wide auth lockout when enforcement endpoint is unreachable.
    }
  }

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

  return responseWithRequestId;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)'],
};
