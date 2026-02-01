import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Use centralized authOptions from lib/auth.ts (single source of truth)
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };