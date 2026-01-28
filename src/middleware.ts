import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const path = req.nextUrl.pathname;
    
    // 🛑 STOP REDIRECTS: Let the user go where the link says
    // If the path is /dashboard/hr, DO NOT move them to /enrollment.
    return NextResponse.next(); 
  },
  {
    callbacks: { authorized: ({ token }) => !!token },
    pages: { signIn: "/auth/signin" }
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/mobilepos/:path*"],
};