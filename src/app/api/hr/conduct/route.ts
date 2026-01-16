import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId, category, severity, description, actionTaken } = await req.json();

    const incident = await prisma.conductIncident.create({
      data: {
        userId,
        category, // e.g., "Late Attendance", "Customer Complaint", "Inventory Mismatch"
        severity, // LOW, MEDIUM, HIGH, CRITICAL
        description,
        actionTaken, // e.g., "Verbal Warning", "Suspension", "Fine"
      }
    });

    // If severity is CRITICAL, automatically suspend the user
    if (severity === 'CRITICAL') {
      await prisma.user.update({
        where: { id: userId },
        data: { status: 'SUSPENDED', isSuspended: true }
      });
    }

    return NextResponse.json({ success: true, data: incident });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}