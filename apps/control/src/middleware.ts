import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_ROUTES = [
  "/control/auth/signin",
  "/control/api/auth",
  "/control/_next",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const tenantCookie = request.cookies.get("__Secure-nexus-admin-session-token") || request.cookies.get("nexus-admin-session-token");

  const token = await getToken({
    req: request,
    secret: process.env.CONTROL_NEXTAUTH_SECRET,
    cookieName: "__Secure-nexus-control-session-token",
  });

  if (!token) {
    const loginUrl = new URL("/control/auth/signin", request.url);
    if (tenantCookie) {
      loginUrl.searchParams.set("error", "tenant_session_rejected");
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/control/:path*"],
};
