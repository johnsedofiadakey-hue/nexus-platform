import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // 🔐 HARD AUTH GUARD
    if (!session?.user) {
      console.log("❌ Init Rejected: No Session", { session });
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /**
     * ✅ CRITICAL FIX
     * JWT sessions may NOT contain user.id reliably.
     * We must resolve the user using email (guaranteed).
     */
    if (!session.user.email) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    // 🧠 Resolve user safely
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { shop: true }
    }) as any; // Cast for bypassGeofence logic

    if (!user) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    // 🚫 UNASSIGNED AGENT Handling
    // Instead of failing with 409, provide a "Roaming" mode for admins
    if (!user.shop) {
      // If Admin/Manager, allow access with default coordinates (e.g. Accra)
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MANAGER') {
        return NextResponse.json({
          agentName: user.name,
          shopName: "Roaming Admin",
          shopLat: 5.6037,
          shopLng: -0.1870,
          radius: 5000,
          managerName: "Self",
          managerPhone: user.phone || ""
        }, { status: 200 });
      }

      // Regular workers strictly need a shop
      return NextResponse.json(
        {
          error: "UNASSIGNED",
          agentName: user.name
        },
        { status: 409 }
      );
    }

    // 🔍 Find Manager (Admin assigned to this shop)
    const manager = await prisma.user.findFirst({
      where: {
        shopId: user.shop.id,
        role: 'ADMIN'
      }
    });

    // 🔒 CHECK LOCKOUT (APPROVED LEAVE or SUSPENDED)
    const today = new Date();
    const activeLeave = await prisma.leaveRequest.findFirst({
      where: {
        userId: user.id,
        status: 'APPROVED',
        startDate: { lte: today },
        endDate: { gte: today }
      }
    });

    const lockout = activeLeave ? {
      active: true,
      reason: 'LEAVE',
      endDate: activeLeave.endDate
    } : null;

    if (user.status === 'SUSPENDED') {
      return NextResponse.json({ error: "ACCOUNT_SUSPENDED" }, { status: 403 });
    }

    // ✅ SUCCESS (MOBILE SAFE CONTRACT)
    return NextResponse.json(
      {
        agentName: user.name,
        shopId: user.shop.id,
        shopName: user.shop.name,
        shopLat: Number(user.shop.latitude),
        shopLng: Number(user.shop.longitude),
        radius: Number(user.shop.radius ?? 100),
        managerName: manager?.name || "HQ Admin",
        managerPhone: manager?.phone || "N/A",
        lockout,
        bypassGeofence: user.bypassGeofence // 🔓 Added Bypass Flag
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("MOBILE INIT ERROR:", error);
    return NextResponse.json(
      { error: "SYSTEM_FAILURE" },
      { status: 500 }
    );
  }
}
