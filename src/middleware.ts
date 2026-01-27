import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Return the response as normal
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Only allow if user is logged in
    },
  }
);

// Protect these routes
export const config = {
  matcher: [
    "/dashboard/:path*", 
    "/admin/:path*",
    "/api/admin/:path*"
  ],
};