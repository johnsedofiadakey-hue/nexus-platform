import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    
    // Allow through if authenticated
    if (token) {
      console.log(`[Proxy] Authenticated: ${req.nextUrl.pathname} | Role: ${token.role}`);
      return NextResponse.next();
    }
    
    // Not authenticated - let NextAuth handle the redirect
    console.log(`[Proxy] Unauthorized access to: ${req.nextUrl.pathname}`);
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access if token exists
        if (token) return true;
        
        // For API routes, return false immediately (no redirect loop)
        if (req.nextUrl.pathname.startsWith('/api/')) {
          return false;
        }
        
        // For pages, allow NextAuth to handle redirect
        return false;
      },
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
);

// Only run on dashboard and mobile routes
export const config = {
  matcher: ["/dashboard/:path*", "/mobilepos/:path*"],
};
