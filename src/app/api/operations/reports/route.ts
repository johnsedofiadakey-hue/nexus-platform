import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { walkIns, buyers, marketIntel, notes, latitude, longitude } = body;

    const report = await prisma.dailyReport.create({
      data: {
        userId: session.user.id,
        walkIns: parseInt(walkIns),
        buyers: parseInt(buyers),
        conversionRate: (parseInt(buyers) / parseInt(walkIns)) * 100 || 0,
        marketIntel: marketIntel,
        notes: notes,
        // Optional: track location of report submission to ensure rep is on-site
      }
    });

    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}