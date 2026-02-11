// 🚨 MIDDLEWARE TEMPORARILY DISABLED
// The middleware was causing redirect loops due to session cookie issues
// Protection is now handled at the page level

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Allow all requests through
  // TODO: Re-enable once session cookies are working
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
