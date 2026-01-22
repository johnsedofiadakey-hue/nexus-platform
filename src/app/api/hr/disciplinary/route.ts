import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) return NextResponse.json([], { status: 400 });

  const records = await prisma.disciplinaryRecord.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { issuer: { select: { name: true } } }
  });

  return NextResponse.json(records);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { userId, type, severity, description } = body;

    // 1. Log the Incident
    const record = await prisma.disciplinaryRecord.create({
      data: {
        userId,
        issuerId: session.user.id,
        type,         // e.g., "LATENESS", "MISCONDUCT", "THEFT", "NEGLIGENCE"
        severity,     // "LOW", "MEDIUM", "CRITICAL"
        description,
      }
    });

    // 2. Auto-Suspend if Critical (Optional Logic)
    if (severity === "CRITICAL") {
      await prisma.user.update({
        where: { id: userId },
        data: { status: "SUSPENDED" }
      });
    }

    return NextResponse.json(record);

  } catch (error) {
    return NextResponse.json({ error: "Failed to issue citation" }, { status: 500 });
  }
}