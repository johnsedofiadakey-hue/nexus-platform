import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',

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

  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,

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

        // 2. 🛡️ SECURE PASSWORD CHECK (Bcrypt)
        const isValid = await compare(credentials.password, user.password);

        if (!isValid) throw new Error("Invalid password");

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          bankName: user.bankName,
          bankAccountNumber: user.bankAccountNumber,
          bankAccountName: user.bankAccountName,
          ssnitNumber: user.ssnitNumber,
          commencementDate: user.commencementDate,
          ghanaCard: user.ghanaCard,
          dob: user.dob
        };
      }
    })
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.organizationId = (user as any).organizationId;
        token.bankName = (user as any).bankName;
        token.bankAccountNumber = (user as any).bankAccountNumber;
        token.bankAccountName = (user as any).bankAccountName;
        token.ssnitNumber = (user as any).ssnitNumber;
        token.commencementDate = (user as any).commencementDate;
        token.ghanaCard = (user as any).ghanaCard;
        token.dob = (user as any).dob;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).organizationId = token.organizationId;
        (session.user as any).bankName = token.bankName;
        (session.user as any).bankAccountNumber = token.bankAccountNumber;
        (session.user as any).bankAccountName = token.bankAccountName;
        (session.user as any).ssnitNumber = token.ssnitNumber;
        (session.user as any).commencementDate = token.commencementDate;
        (session.user as any).ghanaCard = token.ghanaCard;
        (session.user as any).dob = token.dob;
      }
      return session;
    }
  },

  // 🚪 CUSTOM PAGES
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin', // Redirect errors back to login
  },

  // Add useSecureCookies for production
  useSecureCookies: process.env.NODE_ENV === 'production',
};