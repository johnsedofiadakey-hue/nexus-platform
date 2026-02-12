import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

// Check for required environment variables
if (!process.env.NEXTAUTH_SECRET) {
  console.error("❌ CRITICAL: NEXTAUTH_SECRET is not set!");
  console.error("Generate one with: openssl rand -base64 32");
}

if (!process.env.DATABASE_URL) {
  console.error("❌ CRITICAL: DATABASE_URL is not set!");
}

// 🚨 CRITICAL: Check NEXTAUTH_URL for deployment
// Only warn if explicitly in production and not just building
if (!process.env.NEXTAUTH_URL && process.env.NODE_ENV === 'production') {
  console.warn("⚠️  WARNING: NEXTAUTH_URL is not set!");
  console.warn("Set it to your deployment URL: https://your-app.vercel.app");
} else if (process.env.NEXTAUTH_URL?.includes('localhost') && process.env.NODE_ENV === 'production') {
  // During build, Next.js might default this. We only care if it's the final runtime env.
  console.log("ℹ️  Note: NEXTAUTH_URL is localhost. ensure this is correct for your environment.");
}

export const authOptions: NextAuthOptions = {
  debug: true, // Enable debug to see what's happening

  // 🔒 NextAuth configuration

  // 🍪 EXPLICIT COOKIE CONFIGURATION FOR PRODUCTION
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-nexus-admin-session-token'
        : 'nexus-admin-session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Dynamic cookie domain: support Vercel, Railway, or custom domains
        domain: process.env.NODE_ENV === 'production'
          ? (process.env.COOKIE_DOMAIN || undefined)
          : undefined,
      },
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 4 * 60 * 60, // ✅ 4 hours
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

        try {
          // 1. Find User
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() }
          });

          if (!user) {
            console.log("User not found:", credentials.email);
            return null;
          }

          // 2. 🛡️ SECURE PASSWORD CHECK (Bcrypt)
          const isValid = await compare(credentials.password, user.password);

          if (!isValid) {
            console.log("Invalid password for user:", credentials.email);
            return null;
          }

          console.log("✅ User authenticated:", user.email);

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
        } catch (error) {
          console.error("❌ Auth error:", error);
          return null;
        }
      }
    })
  ],

  callbacks: {
    async signIn({ user }) {
      // Allow all authenticated users to sign in
      return true;
    },
    async redirect({ url, baseUrl }) {
      // If redirecting to signin or error page, allow it
      if (url.includes('/auth/signin') || url.includes('/auth/error')) {
        return url;
      }

      // Default behavior: return to the dashboard if no other URL specified
      if (url === baseUrl) return baseUrl + '/dashboard';
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.organizationId = (user as any).organizationId;
        // ✅ Removed: bankName, bankAccountNumber, ssnitNumber, ghanaCard, dob
        // Sensitive data should NEVER be in JWT tokens (visible to client)
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).organizationId = token.organizationId;
        // ✅ Removed: Sensitive data - fetch server-side only when needed
      }
      return session;
    }
  },

  // 🚪 CUSTOM PAGES
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin', // Redirect errors back to login
  },
};