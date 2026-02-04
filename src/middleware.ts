import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // 🔓 LOGGING: Check if the server actually sees your token
    const token = req.nextauth.token;
    console.log(`[Middleware] Visiting: ${req.nextUrl.pathname} | Role: ${token?.role || 'Guest'}`);

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // 🔒 STRICT: Require a valid session token for all matched routes.
        // If false, NextAuth automatically redirects to /auth/signin
        return !!token;
      },
    },
  }
);

// Only run on dashboard and mobile routes
export const config = {
  matcher: ["/dashboard/:path*", "/mobilepos/:path*"],
};