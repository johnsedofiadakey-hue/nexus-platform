import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
    const isAdminApi = req.nextUrl.pathname.startsWith("/api/admin");

    // 1. REJECT NON-ADMINS FROM COMMAND CENTER
    if ((isAdminRoute || isAdminApi) && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/mobilepos", req.url));
    }

    // 2. REJECT NON-USERS FROM MOBILE POS
    const isMobileRoute = req.nextUrl.pathname.startsWith("/mobilepos");
    if (isMobileRoute && !token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Middleware only runs if authorized returns true
      authorized: ({ token }) => !!token,
    },
  }
);

// 🎯 MATCHING PATTERNS
export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/mobilepos/:path*",
  ],
};