import { randomUUID, timingSafeEqual } from "crypto";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logPlatformAction } from "@/lib/platform-audit";

const LOCK_LIMIT = 5;
const LOCK_MINUTES = 30;
const MIN_PASSWORD_LENGTH = Number(
  process.env.CONTROL_MIN_PASSWORD_LENGTH || (process.env.NODE_ENV === "production" ? 12 : 6)
);

const DUMMY_HASH = "$2a$12$6QY2Q2MYf6VVxNUnG9dAr.nw7WoM6wNQ2Wko6aoCA8DmF5asJ5AZW";

function constantTimeMatch(value: boolean): boolean {
  return timingSafeEqual(Buffer.from(value ? "1" : "0"), Buffer.from("1"));
}

export const controlAuthOptions: NextAuthOptions = {
  secret: process.env.CONTROL_NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60,
    updateAge: 0,
  },
  cookies: {
    sessionToken: {
      name: "__Secure-nexus-control-session-token",
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: true,
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "PlatformAdmin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        if (credentials.password.length < MIN_PASSWORD_LENGTH) return null;

        const email = credentials.email.toLowerCase().trim();
        const admin = await prisma.platformAdmin.findUnique({ where: { email } });

        if (!admin || !admin.isActive) {
          await compare(credentials.password, DUMMY_HASH);
          return null;
        }

        if (admin.lockUntil && admin.lockUntil.getTime() > Date.now()) {
          return null;
        }

        const passwordMatches = await compare(credentials.password, admin.passwordHash);
        const isValid = constantTimeMatch(passwordMatches);

        if (!isValid) {
          const failedLoginAttempts = admin.failedLoginAttempts + 1;
          const lockUntil = failedLoginAttempts >= LOCK_LIMIT
            ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
            : null;

          await prisma.platformAdmin.update({
            where: { id: admin.id },
            data: {
              failedLoginAttempts,
              lockUntil,
            },
          });
          return null;
        }

        await prisma.platformAdmin.update({
          where: { id: admin.id },
          data: {
            failedLoginAttempts: 0,
            lockUntil: null,
            lastLoginAt: new Date(),
          },
        });

        await logPlatformAction({
          adminId: admin.id,
          actionType: "PLATFORM_ADMIN_LOGIN",
          metadata: { email: admin.email },
        });

        return {
          id: admin.id,
          email: admin.email,
          role: admin.role,
          sessionNonce: randomUUID(),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.sessionNonce = (user as any).sessionNonce;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).sessionNonce = token.sessionNonce;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};

export async function hashControlPassword(password: string): Promise<string> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error("CONTROL_OWNER_PASSWORD must be at least 12 characters");
  }
  return hash(password, 12);
}
