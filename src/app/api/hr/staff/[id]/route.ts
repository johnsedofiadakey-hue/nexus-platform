import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch single staff details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: { shop: true } // Include shop details
  });
  return NextResponse.json(user);
}

// PATCH: Update staff details (Reassign Shop, Change Phone, etc.)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Prevent updating sensitive fields like 'password' via this route
    const { password, ...safeData } = body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: safeData
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}