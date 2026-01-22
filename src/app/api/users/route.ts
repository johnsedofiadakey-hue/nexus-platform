import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");

  const where: any = { status: "ACTIVE" };
  if (role) where.role = role.toUpperCase();

  // Return only necessary GPS data
  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      lastLat: true,
      lastLng: true,
      lastSync: true,
      shopId: true,
      shop: { select: { name: true } }
    }
  });

  return NextResponse.json(users);
}