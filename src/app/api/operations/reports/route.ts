import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/sessionUser";

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
      buyers,
      conversions,
      marketIntel,
      notes, // mapped to stockGaps
    } = body;

    const resolvedUser = await resolveSessionUser(session);
    if (!resolvedUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const walkInsNum = Number(walkIns) || 0;
    const buyersNum = Number(conversions ?? buyers ?? 0) || 0;

    // 🛡️ PGBOUNCER-SAFE WRITE (NO EXTRA FIELDS)
    const report = await prisma.dailyReport.create({
      data: {
        userId: resolvedUser.id,
        walkIns: walkInsNum,
        buyers: buyersNum,
        marketIntel: marketIntel ?? null,
        stockGaps: notes ?? null,
      },
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
