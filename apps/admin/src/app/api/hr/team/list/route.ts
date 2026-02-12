import { NextResponse } from "next/server";
import { prisma, dbRetry } from "@/lib/prisma";

// Force dynamic rendering for API routes that use database
export const dynamic = 'force-dynamic';
import { requireAuth, handleApiError } from "@/lib/auth-helpers";

/**
 * 🛰️ NEXUS TEAM REGISTRY API
 * Hardened with retry logic for Supabase connection resilience.
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

    // 🛡️ dbRetry: auto-retries on transient connection failures
    const staff = await dbRetry(() =>
      prisma.user.findMany({
        where: orgFilter,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          role: true,
          email: true,
          phone: true,
          status: true,
          lastLat: true,
          lastLng: true,
          lastSeen: true,
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
      })
    );

    const formattedTeam = staff.map((user) => ({
      id: user.id,
      name: user.name || "Unknown Agent",
      role: user.role,
      email: user.email,
      phone: user.phone,
      status: user.status === "ACTIVE" ? "Active" : "Offline",
      shop: user.shop ? { id: user.shop.id, name: user.shop.name } : null,
      shopId: user.shopId,
      image: user.image,

      lastSeen: user.lastSeen,
      lastLat: user.lastLat,
      lastLng: user.lastLng,
      // Geofence context
      location: user.shop ? {
        lat: user.shop.latitude || 5.6037,
        lng: user.shop.longitude || -0.1870
      } : { lat: 5.6037, lng: -0.1870 },

      lastActive: user.lastSeen || user.attendance?.[0]?.checkIn || new Date(),
      isInsideZone: user.isInsideZone || false
    }));

    // Set cache headers to prevent stale reads from edge cache
    return new NextResponse(JSON.stringify({
      data: formattedTeam,
      meta: { total: staff.length }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      },
    });

  } catch (error: any) {
    console.error("❌ TEAM_LIST_SYNC_FAILURE:", error.message);

    // Check for auth errors first
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN" || error.message === "NO_ORGANIZATION") {
      return handleApiError(error);
    }

    return NextResponse.json({ data: [], error: "Internal System Error" }, { status: 500 });
  }
}