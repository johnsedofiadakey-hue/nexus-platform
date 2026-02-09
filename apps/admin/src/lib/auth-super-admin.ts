import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

/**
 * 🔐 SUPER_ADMIN ONLY AUTHENTICATION
 * Enhanced security configuration for super admin accounts
 * - Separate cookie (nexus-super-admin-token)
 * - Stricter session timeout (4 hours)
 * - Additional role verification
 * - Comprehensive audit logging
 */

// ✅ Check for required environment variables
if (!process.env.NEXTAUTH_SUPER_ADMIN_SECRET && process.env.NODE_ENV === 'production') {
  console.error("❌ CRITICAL: NEXTAUTH_SUPER_ADMIN_SECRET is not set!");
  console.error("Generate unique secret: openssl rand -base64 32");
}

export const superAdminAuthOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  trustHost: true,

  // ✅ SUPER_ADMIN SPECIFIC SESSION CONFIG
  cookies: {
    sessionToken: {
      name: 'nexus-super-admin-token', // Different cookie name
      options: {
        httpOnly: true,
        sameSite: 'strict', // Strict CSRF protection
        secure: true, // HTTPS only
        path: '/',
        maxAge: 4 * 60 * 60, // 4 hours max
      }
    }
  },

  session: {
    strategy: "jwt",
    maxAge: 4 * 60 * 60, // 4 hours
  },

  secret: process.env.NEXTAUTH_SUPER_ADMIN_SECRET || process.env.NEXTAUTH_SECRET,

  providers: [
    CredentialsProvider({
      name: "SuperAdmin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          // 1. Find user
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() }
          });

          if (!user) {
            console.warn(`Login attempt with non-existent email: ${credentials.email}`);
            return null;
          }

          // ✅ VERIFY SUPER_ADMIN ROLE (Critical check)
          if (user.role !== 'SUPER_ADMIN') {
            console.warn(`Non-SUPER_ADMIN login attempt for SUPER_ADMIN portal: ${credentials.email} (role: ${user.role})`);
            
            // ✅ Log failed privilege escalation attempt
            await prisma.auditLog.create({
              data: {
                userId: user.id,
                action: 'FAILED_SUPER_ADMIN_LOGIN',
                entity: 'User',
                entityId: user.id,
                details: JSON.stringify({
                  email: user.email,
                  actualRole: user.role,
                  attemptedAccess: 'SUPER_ADMIN',
                  timestamp: new Date().toISOString(),
                  security: 'PRIVILEGE_ESCALATION_ATTEMPT'
                })
              }
            });
            
            return null;
          }

          // ✅ VERIFY ACCOUNT IS ACTIVE
          if (user.status !== 'ACTIVE') {
            console.warn(`Disabled account login attempt: ${credentials.email} (status: ${user.status})`);
            return null;
          }

          // 2. Verify password
          const isValid = await compare(credentials.password, user.password);
          if (!isValid) {
            console.warn(`Invalid password for SUPER_ADMIN: ${credentials.email}`);
            
            // ✅ Log failed login attempt
            await prisma.auditLog.create({
              data: {
                userId: user.id,
                action: 'FAILED_LOGIN',
                entity: 'User',
                entityId: user.id,
                details: JSON.stringify({
                  email: user.email,
                  reason: 'invalid_password',
                  timestamp: new Date().toISOString()
                })
              }
            });
            
            return null;
          }

          // ✅ Log successful SUPER_ADMIN login
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: 'SUPER_ADMIN_LOGIN',
              entity: 'User',
              entityId: user.id,
              details: JSON.stringify({
                email: user.email,
                timestamp: new Date().toISOString(),
                security: 'SUPER_ADMIN_ACCESS'
              })
            }
          });

          console.log(`✅ SUPER_ADMIN authenticated: ${user.email}`);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: null, // SUPER_ADMIN has no org
          };
        } catch (error) {
          console.error("SUPER_ADMIN auth error:", error);
          return null;
        }
      }
    })
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        // ✅ NO sensitive data in JWT
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        // ✅ NO sensitive data in session
      }
      return session;
    }
  },

  pages: {
    signIn: '/auth/super-admin/signin',
    error: '/auth/super-admin/signin',
  },

  // ✅ Always use secure cookies for SUPER_ADMIN
  useSecureCookies: true,
};
