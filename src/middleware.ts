import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Log authentication status for debugging
    const token = req.nextauth.token;
    console.log(`[Middleware] Visiting: ${req.nextUrl.pathname} | Role: ${token?.role || 'Guest'}`);
    
    return NextResponse.next();
  },
  {
    callbacks: {
      /**
       * Authorization callback - controls access to protected routes
       * 
       * Options:
       * 1. Production: Return !!req.nextauth.token (only allow authenticated users)
       * 2. Development bypass: Set DEV_AUTH_BYPASS=true in .env (server-side only) to allow unauthenticated access
       * 
       * Current setting: Checks for valid token OR dev bypass flag
       */
      authorized: ({ req, token }) => {
        // Allow access if user has valid token
        if (token) return true;
        
        // Dev bypass: Allow access if explicitly enabled (USE ONLY IN DEVELOPMENT)
        // NOTE: Uses server-side env var (not NEXT_PUBLIC_) for security
        if (process.env.DEV_AUTH_BYPASS === "true") {
          console.log("[Middleware] ⚠️ DEV BYPASS ENABLED - Allowing unauthenticated access");
          return true;
        }
        
        // Deny access if no token and no dev bypass
        return false;
      }
    }
  }
);

// Only run on dashboard and mobile routes
export const config = {
  matcher: ["/dashboard/:path*", "/mobilepos/:path*"],
};