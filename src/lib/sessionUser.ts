import { prisma } from "./prisma";

/**
 * Resolve a full Prisma `User` record from a NextAuth session object.
 * Prefer `session.user.id` when available; otherwise fall back to `session.user.email`.
 */
export async function resolveSessionUser(session: any) {
  if (!session || !session.user) return null;
  const uid = session.user.id as string | undefined;
  if (uid) {
    return prisma.user.findUnique({ where: { id: uid } });
  }
  const email = session.user.email as string | undefined;
  if (email) {
    return prisma.user.findUnique({ where: { email } });
  }
  return null;
}
