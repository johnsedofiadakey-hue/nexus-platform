import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Nexus Commander Portal",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) return null;

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) return null;

        // Return initial state on login
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          isSuspended: user.isSuspended,
        };
      }
    })
  ],
  callbacks: {
    // 1. JWT Callback: Pass basic ID/Email to the token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    
    // 2. SESSION Callback: "God Mode" / Fresh Data Fetch
    // Instead of trusting the cookie, we ask the DB: "Is this user still active?"
    async session({ session, token }) {
      if (session.user && token.email) {
        try {
          const freshUser = await prisma.user.findUnique({
            where: { email: token.email },
            select: { 
              id: true, 
              role: true, 
              status: true, 
              isSuspended: true 
            }
          });

          if (freshUser) {
            // Overwrite session data with REAL-TIME database values
            (session.user as any).id = freshUser.id;
            (session.user as any).role = freshUser.role;
            (session.user as any).status = freshUser.status;
            (session.user as any).isSuspended = freshUser.isSuspended;
          }
        } catch (error) {
          console.error("Nexus Auth Sync Error:", error);
        }
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };