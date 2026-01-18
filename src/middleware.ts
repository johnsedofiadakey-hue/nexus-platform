import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Public routes that should never trigger auth logic
        if (
          pathname.startsWith("/login") ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/public") ||
          pathname.startsWith("/api") ||
          pathname === "/"
        ) {
          return true;
        }

        return !!token;
      },
    },
  }
);

export const config = {
  // Ignore static assets, images, and next internal files
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|assets|images|public).*)",
  ],
};