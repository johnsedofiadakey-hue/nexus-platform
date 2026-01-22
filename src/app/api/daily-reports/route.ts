import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    
    // If userId provided, filter by it (Personal History)
    // If not, fetch all (Admin View)
    const where = userId ? { userId } : {};

    const reports = await prisma.dailyReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { 
        user: { select: { name: true, shop: { select: { name: true } } } } 
      }
    });

    return NextResponse.json(reports);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { walkIns, inquiries, marketIntel } = body;

    // Get the User ID from the session (Secure)
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const report = await prisma.dailyReport.create({
      data: {
        userId: user.id,
        walkIns: parseInt(walkIns) || 0,
        inquiries: parseInt(inquiries) || 0,
        marketIntel
      }
    });

    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}