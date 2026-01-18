import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter"; // Best practice to include
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Sign in",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        // 1. FETCH USER & SHOP LINK (CRITICAL FIX)
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { shop: true } // <--- This was missing!
        });

        if (!user) return null;

        const isPasswordValid = await compare(credentials.password, user.password);
        if (!isPasswordValid) return null;

        // 2. RETURN THE "PASSPORT"
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          shopId: user.shopId // <--- Pass this to the token
        };
      }
    })
  ],
  callbacks: {
    // 3. BAKE DATA INTO TOKEN
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.shopId = (user as any).shopId; // <--- Critical
      }
      return token;
    },
    // 4. EXPOSE DATA TO SESSION (FRONTEND)
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role,
          shopId: token.shopId // <--- Now the app knows the shop!
        }
      };
    }
  }
};