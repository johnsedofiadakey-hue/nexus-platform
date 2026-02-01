import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Validate required environment variables
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error(
    "❌ NEXTAUTH_SECRET is not defined. Please set it in your .env file.\n" +
    "   Generate one with: openssl rand -base64 32"
  );
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "❌ DATABASE_URL is not defined. Please set it in your .env file."
  );
}

// Use centralized authOptions from lib/auth.ts for consistency
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };