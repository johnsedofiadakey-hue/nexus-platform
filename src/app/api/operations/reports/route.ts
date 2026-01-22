import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { resolveSessionUser } from "@/lib/sessionUser";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    // Accept both legacy 'buyers' and newer 'conversions' field names
    const { walkIns, buyers, conversions, marketIntel, notes, latitude, longitude } = body;
    const conv = parseInt(conversions ?? buyers ?? 0) || 0;

    // Resolve the authoritative user id for the report. Some session shapes don't include `id`.
    const sessionUser = await resolveSessionUser(session);
    if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const report = await prisma.dailyReport.create({
      data: {
        userId: sessionUser.id,
        walkIns: parseInt(walkIns) || 0,
        conversions: conv,
        conversionRate: (conv / (parseInt(walkIns) || 1)) * 100 || 0,
        marketIntel: marketIntel,
        notes: notes,
      }
    });

    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}