import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET: Fetch Targets (All or by User)
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const isSuperAdmin = session.user.role === 'SUPER_ADMIN';
        if (!isSuperAdmin && !session.user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        const targets = await prisma.target.findMany({
            where: userId ? { userId } : (isSuperAdmin ? {} : { user: { organizationId: session.user.organizationId } }),
            include: { user: { select: { name: true, image: true } } },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(targets);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create Target
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const isSuperAdmin = session.user.role === 'SUPER_ADMIN';
        if (!isSuperAdmin && !session.user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { userId, targetQuantity, targetValue, startDate, endDate } = body;

        const target = await prisma.target.create({
            data: {
                userId,
                targetQuantity: parseInt(targetQuantity) || 0,
                targetValue: parseFloat(targetValue) || 0,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                status: "ACTIVE"
            }
        });

        return NextResponse.json(target);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
