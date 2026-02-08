import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-helpers";

/**
 * 🛰️ NEXUS TEAM REGISTRY API
 * Optimized for high-speed synchronization and geofence tracking.
 * 🔒 SECURED: Enforces authentication and multi-tenancy isolation
 */
export async function GET() {
  try {
    // 🔐 Require authentication
    const user = await requireAuth();

    // 🏢 Build organization filter (Super Admin sees all)
    const orgFilter = user.role === "SUPER_ADMIN" && !user.organizationId
      ? {} // Super admin without org sees all
      : { organizationId: user.organizationId };

    const staff = await prisma.user.findMany({
      where: orgFilter,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        role: true,
        email: true,
        phone: true,
        status: true,
        shopId: true,
        isInsideZone: true,
        image: true,
        shop: {
          select: {
            id: true,
            name: true,
            location: true,
            latitude: true,
            longitude: true,
            radius: true
          }
        },
        attendance: {
          take: 1,
          orderBy: { date: 'desc' },
          select: { checkIn: true }
        }
      },
    });

    const formattedTeam = staff.map((user) => ({
      id: user.id,
      name: user.name || "Unknown Agent",
      role: user.role,
      status: user.status === "ACTIVE" ? "Active" : "Offline",
      shop: user.shop?.name || "Unassigned",
      shopId: user.shopId,
      image: user.image,

      // Geofence context
      location: user.shop ? {
        lat: user.shop.latitude || 5.6037,
        lng: user.shop.longitude || -0.1870
      } : { lat: 5.6037, lng: -0.1870 },

      lastActive: user.attendance?.[0]?.checkIn || new Date(),
      isInsideZone: user.isInsideZone || false
    }));

    return NextResponse.json({
      data: formattedTeam,
      meta: { total: staff.length }
    });

  } catch (error: any) {
    console.error("❌ TEAM_LIST_SYNC_FAILURE:", error.message);

    // Check for auth errors first
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN" || error.message === "NO_ORGANIZATION") {
      return handleApiError(error);
    }

    // Specific guard for the Prepared Statement crash
    if (error.message.includes("prepared statement")) {
      return NextResponse.json(
        { error: "Database Cache Desync. Please retry in 5s.", code: "POOL_RESET" },
        { status: 503 }
      );
    }

    return NextResponse.json({ data: [], error: "Internal System Error" }, { status: 500 });
  }
}