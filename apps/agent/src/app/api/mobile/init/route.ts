import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for API routes that use database
export const dynamic = 'force-dynamic';
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

    // 🧠 Resolve user safely with optimized query
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        image: true,
        role: true,
        phone: true,
        status: true,
        bypassGeofence: true,
        shopId: true,
        shop: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
            radius: true,
            managerName: true,
            managerContact: true
          }
        }
      }
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
          id: user.id,
          agentName: user.name,
          agentImage: user.image,
          shopId: null,
          shopName: "Roaming Admin",
          shopLat: 5.6037,
          shopLng: -0.1870,
          radius: 5000,
          managerName: "Self",
          managerPhone: user.phone || "",
          bypassGeofence: true
        }, { status: 200 });
      }

      // Regular workers strictly need a shop
      console.log(`❌ User ${user.email} has no shop assignment`);
      return NextResponse.json(
        {
          error: "UNASSIGNED",
          agentName: user.name,
          message: "No shop assigned. Contact your administrator."
        },
        { status: 409 }
      );
    }

    // 🔍 Find Manager - Temporarily disabled for testing
    const manager = null;

    // 🔒 CHECK LOCKOUT (APPROVED LEAVE or SUSPENDED) - Temporarily disabled for testing
    const lockout = null;
    const targetProgress = null;

    if (user.status === 'SUSPENDED') {
      return NextResponse.json({ error: "ACCOUNT_SUSPENDED" }, { status: 403 });
    }

    // ✅ SUCCESS (MOBILE SAFE CONTRACT)
    return NextResponse.json(
      {
        id: user.id, // 👈 KEY AUTH FIELD
        agentName: user.name,
        agentImage: user.image, // 📸 Added Profile Image
        shopId: user.shop.id,
        shopName: user.shop.name,
        shopLat: Number(user.shop.latitude),
        shopLng: Number(user.shop.longitude),
        radius: Number(user.shop.radius ?? 100),
        // 🏪 Prioritize Shop Settings, then fallback to Admin User
        managerName: user.shop.managerName || manager?.name || "HQ Admin",
        managerPhone: user.shop.managerContact || manager?.phone || "N/A",
        lockout,
        targetProgress, // 🎯 Added Target Data
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
