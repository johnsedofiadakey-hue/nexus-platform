import NextAuth from "next-auth";
import { controlAuthOptions } from "@/lib/auth";

const handler = NextAuth(controlAuthOptions);

export { handler as GET, handler as POST };
