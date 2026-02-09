import NextAuth from "next-auth";
import { superAdminAuthOptions } from "@/lib/auth-super-admin";

/**
 * 🔐 SEPARATE SUPER_ADMIN AUTHENTICATION ENDPOINT
 * Only SUPER_ADMIN accounts can authenticate through this route
 */

// Force dynamic rendering to avoid build-time database access
export const dynamic = 'force-dynamic';

const handler = NextAuth(superAdminAuthOptions);

export { handler as GET, handler as POST };
