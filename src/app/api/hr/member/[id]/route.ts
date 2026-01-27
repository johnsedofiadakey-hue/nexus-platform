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
    
    // 🛡️ PROFESSIONAL LOGGING: Simple English only
    console.log(`Syncing records for: ${id}`);

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        shop: { select: { id: true, name: true, location: true, latitude: true, longitude: true, radius: true } },
        sales: { take: 20, orderBy: { createdAt: 'desc' } },
        dailyReports: { take: 10, orderBy: { createdAt: 'desc' } },
        attendance: { take: 10, orderBy: { date: 'desc' } }, 
        leaves: { take: 10, orderBy: { id: 'desc' } },
        
        // ✅ FIXED: Changed 'disciplinaryLog' to 'disciplinary' to match your actual schema
        disciplinary: { 
          orderBy: { id: 'desc' },
          take: 30 
        },
        
        sentMessages: { take: 20, orderBy: { createdAt: 'desc' } },
        receivedMessages: { take: 20, orderBy: { createdAt: 'desc' } },
      }
    });

    if (!user) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    // 🧠 MAPPING: We keep the frontend variable as 'disciplinaryLog' for UI compatibility, 
    // but pull the data from the 'disciplinary' database relation
    const disciplinaryLog = user.disciplinary || [];
    
    const chatHistory = [...(user.sentMessages || []), ...(user.receivedMessages || [])]
      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // 📈 Logic for Geofence Status Charts
    const geofenceStats = disciplinaryLog
      .filter(log => log.type === 'GEOFENCE_BREACH')
      .reduce((acc: any[], log) => {
        const logDate = log.createdAt || new Date(); 
        const day = new Date(logDate).toLocaleDateString('en-US', { weekday: 'short' });
        const existing = acc.find(a => a.name === day);
        if (existing) existing.breaches += 1;
        else acc.push({ name: day, breaches: 1 });
        return acc;
      }, []);

    return NextResponse.json({
      ...user,
      disciplinaryLog, // Injected for your frontend components
      messages: chatHistory,
      geofenceStats, 
      viewerId: session.user.id,
      targets: { revenue: 15000, volume: 100 } 
    });

  } catch (error: any) {
    console.error("System Sync Error:", error.message);
    return NextResponse.json({ error: "Failed to sync records" }, { status: 500 });
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

    if (action === 'UPDATE_PROFILE') {
      const updated = await prisma.user.update({
        where: { id },
        data: {
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          shopId: payload.shopId || null
        }
      });
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'RESET_PASSWORD') {
      const hashedPassword = await bcrypt.hash(payload.password, 12);
      await prisma.user.update({
        where: { id },
        data: { password: hashedPassword }
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'MANAGE_LEAVE') {
      await prisma.leaveRequest.update({
        where: { id: payload.leaveId },
        data: { status: payload.status }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Protocol undefined" }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}

// --- 🗑️ DELETE: ACCOUNT PURGE ---
export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await props.params;
    const { id } = params;

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: "Removal failed" }, { status: 500 });
  }
}