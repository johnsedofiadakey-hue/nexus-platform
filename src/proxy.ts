import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdminPath = req.nextUrl.pathname.startsWith("/admin");
    
    // Redirect non-admins trying to access the Command Center
    if (isAdminPath && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/mobilepos", req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Matching paths for the Proxy to monitor
export const config = {
  matcher: ["/admin/:path*", "/mobilepos/:path*", "/api/admin/:path*"],
};