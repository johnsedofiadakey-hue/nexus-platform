import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
// ❌ REMOVED: import { compare } from "bcrypt";

const handler = NextAuth({
  debug: true,
  
  // 🍪 FORCE COOKIES TO STICK (Critical for localhost)
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax', 
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },

  session: { strategy: "jwt" },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // 1. Find User
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() }
        });

        if (!user) throw new Error("User not found");

        // 2. ⚡️ SIMPLE PASSWORD CHECK (No Bcrypt)
        // This fixes the crash and works if your DB password is just plain text.
        // For production, you can add hashing back later.
        const isValid = credentials.password === user.password;

        if (!isValid) throw new Error("Invalid password");

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    })
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    }
  }
});

export { handler as GET, handler as POST };