import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for API routes that use database
export const dynamic = 'force-dynamic';
import { requireAuth, handleApiError } from "@/lib/auth-helpers";
import { logActivity, getClientIp, getUserAgent } from "@/lib/activity-logger";

export async function POST(req: Request) {
  try {
    // 🔐 Require authentication (vetted auth helper)
    const user = await requireAuth();

    const body = await req.json();

    // Accept both legacy and new naming
    const {
      walkIns,
      inquiries,
      buyers,
      conversions,
      marketIntel,
      stockGaps,
      notes,
    } = body;

    const walkInsNum = Number(walkIns) || 0;
    const inquiriesNum = Number(inquiries) || 0;
    const buyersNum = Number(conversions ?? buyers ?? 0) || 0;

    // 🛡️ PGBOUNCER-SAFE WRITE — now linked to shop
    const report = await prisma.dailyReport.create({
      data: {
        userId: user.id,
        shopId: (user as any).shopId || null,
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

    // 📝 Log activity for HQ feed
    await logActivity({
      userId: user.id,
      userName: user.name || "Unknown Agent",
      userRole: (user as any).role || "WORKER",
      action: "DAILY_REPORT_SUBMITTED",
      entity: "DailyReport",
      entityId: report.id,
      description: `Submitted daily report: ${walkInsNum} walk-ins, ${buyersNum} buyers${marketIntel ? ', with competitor intel' : ''}`,
      metadata: { walkIns: walkInsNum, inquiries: inquiriesNum, buyers: buyersNum, hasIntel: !!marketIntel },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      shopId: (user as any).shopId,
      shopName: (user as any).shop?.name,
    });

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error("DAILY REPORT ERROR:", error);

    // Check for auth errors via helper
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return handleApiError(error);
    }

    return NextResponse.json(
      { success: false, error: "Failed to submit report" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    // 🔐 Require authentication
    const user = await requireAuth();

    // 🏢 Build organization filter
    const orgFilter = user.role === "SUPER_ADMIN" && !user.organizationId
      ? {} // Super admin sees all
      : { organizationId: user.organizationId };

    // Check for filters
    const { searchParams } = new URL(req.url);
    const promoterOnly = searchParams.get('promoterOnly') === 'true';
    const shopIdFilter = searchParams.get('shopId');

    const userFilter: any = { ...orgFilter };
    if (promoterOnly) {
      userFilter.role = 'PROMOTER';
    }

    const whereClause: any = { user: userFilter };
    if (shopIdFilter) {
      whereClause.shopId = shopIdFilter;
    }

    const reports = await prisma.dailyReport.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, image: true, role: true, shop: { select: { id: true, name: true } } } },
        shop: { select: { id: true, name: true } }
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
