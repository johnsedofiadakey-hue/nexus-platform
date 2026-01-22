import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/sessionUser";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sessionUser = await resolveSessionUser(session);
    if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Force a fresh database fetch
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      include: { shop: true }
    });

    if (!user) return NextResponse.json({ error: "User Not Found" }, { status: 404 });

    const response = NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      shopName: user.shop?.name || "Field Operations",
      shopLocation: user.shop?.location || "N/A"
    });

    // ✅ ADDING HEADERS TO KILL CACHING
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}