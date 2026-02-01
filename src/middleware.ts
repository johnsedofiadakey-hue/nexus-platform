import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Log access for debugging purposes
    const token = req.nextauth.token;
    console.log(`[Middleware] Visiting: ${req.nextUrl.pathname} | Role: ${token?.role || 'Guest'}`);
    
    return NextResponse.next();
  },
  {
    callbacks: {
      // ✅ PROPER AUTH CHECK: Verify token exists
      // This ensures users must be authenticated to access protected routes.
      // 
      // To temporarily bypass in development (server-side only), set SERVER_DEV_BYPASS=true in .env
      // However, this is NOT recommended as it masks authentication issues.
      authorized: ({ token }) => {
        // Check for dev bypass (server-side only - use with caution)
        if (process.env.SERVER_DEV_BYPASS === 'true') {
          console.warn('⚠️  [Middleware] Auth bypass is ENABLED. Disable in production!');
          return true;
        }
        
        // Require valid token with role
        return !!token?.role;
      }, 
    },
  }
);

// Only run on dashboard and mobile routes
export const config = {
  matcher: ["/dashboard/:path*", "/mobilepos/:path*"],
};