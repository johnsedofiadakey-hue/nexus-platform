import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // 1. If not logged in, return 401 (Unauthorized)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch User & Shop Details
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { shop: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Return Clean JSON (include id for client-side realtime subscriptions)
    return NextResponse.json({
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email,
      phone: user.phone || "No Phone",
      status: user.status,
      shopName: user.shop?.name || "Unassigned",
      shopLocation: user.shop?.location || "N/A"
    });

  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}