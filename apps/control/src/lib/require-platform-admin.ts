import { getServerSession } from "next-auth";
import { controlAuthOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requirePlatformAdmin() {
  const session = await getServerSession(controlAuthOptions);
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }

  const admin = await prisma.platformAdmin.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true, isActive: true },
  });

  if (!admin || !admin.isActive) {
    throw new Error("UNAUTHORIZED");
  }

  return admin;
}
