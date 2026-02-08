import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const agent = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

        // Fetch last 20 reports
        const reports = await prisma.dailyReport.findMany({
            where: { userId: agent.id },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        // Fetch last 20 leaves
        const leaves = await prisma.leaveRequest.findMany({
            where: { userId: agent.id },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        // Fetch last 20 sales (for void logic)
        const sales = await prisma.sale.findMany({
            where: { userId: agent.id },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: { items: { include: { product: true } } }
        });

        return NextResponse.json({
            reports,
            leaves,
            sales
        });

    } catch (e) {
        return NextResponse.json({ error: "Sync Error" }, { status: 500 });
    }
}
