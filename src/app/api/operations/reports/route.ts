import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/sessionUser";
import { logActivity, getClientIp, getUserAgent } from "@/lib/activity-logger";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Accept both legacy and new naming
    const {
      walkIns,
      inquiries,
      buyers,
      conversions,
      marketIntel,
      stockGaps, // 🆕 ADDED
      notes,
    } = body;

    const resolvedUser = await resolveSessionUser(session);
    if (!resolvedUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const walkInsNum = Number(walkIns) || 0;
    const inquiriesNum = Number(inquiries) || 0;
    const buyersNum = Number(conversions ?? buyers ?? 0) || 0;

    // 🛡️ PGBOUNCER-SAFE WRITE (NO EXTRA FIELDS)
    const report = await prisma.dailyReport.create({
      data: {
        userId: resolvedUser.id,
        walkIns: walkInsNum,
        inquiries: inquiriesNum,
        buyers: buyersNum,
        marketIntel: marketIntel ?? null,
        stockGaps: stockGaps ?? null,
        notes: notes ?? null,
      },
      include: {
        user: {
          include: {
            shop: true
          }
        }
      }
    });

    // Log activity
    await logActivity({
      userId: resolvedUser.id,
      userName: resolvedUser.name || "Unknown Agent",
      userRole: resolvedUser.role || "WORKER",
      action: "DAILY_REPORT_SUBMITTED",
      entity: "DailyReport",
      entityId: report.id,
      description: `Submitted daily report: ${walkInsNum} walk-ins, ${buyersNum} buyers${marketIntel ? ', with competitor intel' : ''}`,
      metadata: { walkIns: walkInsNum, inquiries: inquiriesNum, buyers: buyersNum, hasIntel: !!marketIntel },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      shopId: resolvedUser.shopId,
      shopName: resolvedUser.shop?.name,
    });

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error("DAILY REPORT ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit report" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const reports = await prisma.dailyReport.findMany({
      include: {
        user: { select: { name: true, image: true, shop: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return NextResponse.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error("FETCH REPORTS ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
