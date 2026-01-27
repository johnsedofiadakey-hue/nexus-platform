import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma"; 
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  // 🛡️ CRITICAL FIX 1: Explicitly bind the secret to prevent decryption errors
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    CredentialsProvider({
      name: "Nexus Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Atomic lookup: includes shop details for location verification
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { shop: true }
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          shopId: user.shopId,
          // 🛡️ CRITICAL FIX 2: Changed 'lat/lng' to 'latitude/longitude' to match your Prisma Schema
          shopLat: user.shop?.latitude || 0,
          shopLng: user.shop?.longitude || 0,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 Day Session
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.shopId = (user as any).shopId;
        token.shopLat = (user as any).shopLat;
        token.shopLng = (user as any).shopLng;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).shopId = token.shopId;
        (session.user as any).shopLat = token.shopLat;
        (session.user as any).shopLng = token.shopLng;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  }
};