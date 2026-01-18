import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    const { status } = body; // 'APPROVED' or 'REJECTED'

    const updatedLeave = await prisma.leaveRequest.update({
      where: { id: resolvedParams.id },
      data: { status }
    });

    return NextResponse.json(updatedLeave);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}