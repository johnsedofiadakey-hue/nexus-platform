import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

// --- 🛰️ GET: SYNC COMPLETE MEMBER INTEL ---
export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await props.params;
    const { id } = params;

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    console.log(`Syncing records for Operative: ${id}`);

    const whereClause: any = { id };

    // 🔐 Tenant Isolation (Bypass for Super Admin)
    if (session.user.role !== 'SUPER_ADMIN') {
      whereClause.organizationId = session.user.organizationId;
    }

    const { searchParams } = new URL(req.url);
    const light = searchParams.get('light') === 'true';

    const include: any = {
      shop: {
        select: {
          id: true, name: true, location: true,
          latitude: true, longitude: true, radius: true
        }
      },
      targets: { where: { status: 'ACTIVE' }, orderBy: { endDate: 'desc' } }
    };

    if (!light) {
      include.sales = { take: 20, orderBy: { createdAt: 'desc' } };
      include.dailyReports = { take: 50, orderBy: { createdAt: 'desc' } };
      include.attendance = { take: 30, orderBy: { date: 'desc' } };
      include.leaves = { take: 50, orderBy: { createdAt: 'desc' } };
      include.disciplinary = { take: 30, orderBy: { createdAt: 'desc' } };
      include.sentMessages = { take: 20, orderBy: { createdAt: 'desc' } };
      include.receivedMessages = { take: 20, orderBy: { createdAt: 'desc' } };
    } else {
      // Light mode might still need minimal disciplinary for geofence breaches if required by the UI
      include.disciplinary = { take: 30, orderBy: { createdAt: 'desc' } };
    }

    const user = await prisma.user.findFirst({
      where: whereClause,
      include
    });

    if (!user) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    const disciplinaryLog = user.disciplinary || [];

    // Combine messages into a unified timeline
    const chatHistory = [...(user.sentMessages || []), ...(user.receivedMessages || [])]
      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // 📈 GEOSPATIAL ANALYSIS: Calculate Breaches for the Performance Chart
    const geofenceStats = disciplinaryLog
      .filter(log => log.type === 'GEOFENCE_BREACH')
      .reduce((acc: any[], log) => {
        const logDate = log.createdAt || new Date();
        const day = new Date(logDate).toLocaleDateString('en-US', { weekday: 'short' });
        const existing = acc.find(a => a.name === day);
        if (existing) {
          existing.breaches += 1;
        } else {
          acc.push({ name: day, breaches: 1 });
        }
        return acc;
      }, []);

    return NextResponse.json({
      ...user,
      disciplinaryLog,
      messages: chatHistory,
      geofenceStats,
      viewerId: session.user.id,
      targets: user.targets || []
    });

  } catch (error: any) {
    console.error("System Sync Error:", error);
    console.error("Error Details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });

    // 🛡️ Prepared Statement Guard
    if (error.message?.includes("prepared statement")) {
      return NextResponse.json({
        error: "Database Connection Refused. System cache desync.",
        code: "PG_POOLER_RESET",
        details: error.message
      }, { status: 503 });
    }

    // 🔍 Schema Migration Required
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      return NextResponse.json({
        error: "Database schema out of sync. Migration required.",
        code: "SCHEMA_MISMATCH",
        details: "Run: npx prisma db push",
        hint: error.message
      }, { status: 503 });
    }

    return NextResponse.json({ 
      error: "Failed to sync records",
      details: error.message,
      code: error.code || "UNKNOWN"
    }, { status: 500 });
  }
}

// --- 🛠️ PATCH: ADMINISTRATIVE OVERRIDES ---
export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await props.params;
    const { id } = params;

    const body = await req.json();
    const { action, ...payload } = body;

    // Verify ownership first
    // Verify ownership first (God Mode for Super Admin)
    const whereCheck: any = { id };
    if (session.user.role !== 'SUPER_ADMIN') {
      whereCheck.organizationId = session.user.organizationId;
    }

    const targetUser = await prisma.user.findFirst({ where: whereCheck });
    if (!targetUser) return NextResponse.json({ error: "Access Denied" }, { status: 403 });

    if (action === 'UPDATE_PROFILE') {
      const updateData: any = {
        name: payload.name,
        email: payload.email?.toLowerCase().trim(),
        phone: payload.phone,
        status: payload.status,
        shopId: payload.shopId || null,
        bypassGeofence: payload.bypassGeofence,
        bankName: payload.bankName || null,
        bankAccountNumber: payload.bankAccountNumber || null,
        bankAccountName: payload.bankAccountName || null,
        ssnitNumber: payload.ssnitNumber || null,
      };

      // 🏆 Sync Organization if Shop is changed
      if (payload.shopId && payload.shopId !== targetUser.shopId) {
        const newShop = await prisma.shop.findUnique({
          where: { id: payload.shopId },
          select: { organizationId: true }
        });
        if (newShop) {
          updateData.organizationId = newShop.organizationId;
        }
      }

      if (payload.commencementDate) {
        const parsedDate = new Date(payload.commencementDate);
        if (!isNaN(parsedDate.getTime())) {
          updateData.commencementDate = parsedDate;
        }
      } else {
        updateData.commencementDate = null;
      }

      if (payload.password && payload.password.length > 0) {
        updateData.password = await bcrypt.hash(payload.password, 12);
      }

      const updated = await prisma.user.update({
        where: { id },
        data: updateData
      });
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'RESET_PASSWORD') {
      // Standalone action (Legacy/Specific)
      if (!payload.password) return NextResponse.json({ error: "Password required" }, { status: 400 });
      const hashedPassword = await bcrypt.hash(payload.password, 12);
      await prisma.user.update({
        where: { id },
        data: { password: hashedPassword }
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'MANAGE_LEAVE') {
      await prisma.leaveRequest.update({
        where: { id: payload.leaveId }, // Ideally verify leave belongs to this user too
        data: { status: payload.status }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action protocol undefined" }, { status: 400 });

  } catch (error: any) {
    console.error("Administrative Override Failure:", error.message);
    return NextResponse.json({ error: "Database rejected the override" }, { status: 500 });
  }
}

// --- 🗑️ DELETE: ACCOUNT PURGE ---
export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await props.params;
    const { id } = params;

    // Verify ownership first (God Mode for Super Admin)
    const whereCheck: any = { id };
    if (session.user.role !== 'SUPER_ADMIN') {
      whereCheck.organizationId = session.user.organizationId;
    }

    const targetUser = await prisma.user.findFirst({ where: whereCheck });
    if (!targetUser) return NextResponse.json({ error: "Access Denied" }, { status: 403 });

    // First delete or unassign related records if Prisma relation isn't set to Cascade
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Purge Error:", error.message);
    return NextResponse.json({ error: "Failed to remove personnel" }, { status: 500 });
  }
}