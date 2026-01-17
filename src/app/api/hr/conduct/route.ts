import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET: Fetch all disciplinary records
export async function GET() {
  try {
    const incidents = await prisma.conductIncident.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true, shop: { select: { name: true } } } }
      }
    });
    return NextResponse.json(incidents);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
  }
}

// POST: Log a new incident
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, category, severity, description, actionTaken } = body;

    const incident = await prisma.conductIncident.create({
      data: {
        userId,
        category,
        severity,
        description,
        actionTaken: actionTaken || "Pending Review"
      }
    });

    return NextResponse.json(incident);
  } catch (error) {
    console.error("Conduct Log Error:", error);
    return NextResponse.json({ error: "Failed to log incident" }, { status: 500 });
  }
}