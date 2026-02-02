import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const agents = await prisma.user.findMany({
            where: {
                organizationId: session.user.organizationId,
                role: { in: ['WORKER', 'MANAGER'] },
                status: 'ACTIVE'
            },
            include: {
                shop: { select: { name: true } },
                _count: {
                    select: {
                        sales: { where: { createdAt: { gte: today } } }
                    }
                },
                // Fetch today's sales sum? Prisma aggregate is separate...
                // For list view, maybe count is enough, or we do a separate grouped query.
                // Let's keep it simple: Count of sales today.

                attendance: {
                    where: { date: { gte: today } },
                    orderBy: { checkIn: 'desc' },
                    take: 1
                }
            },
            orderBy: { name: 'asc' }
        });

        // 2. Calculate Sales Volume separately if needed (Aggregate)
        // For now, let's just return the list with sale count.

        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const formatted = agents.map(agent => {
            const isOnline = agent.lastSeen ? agent.lastSeen > fiveMinutesAgo : false;
            const lastAttendance = agent.attendance[0];

            return {
                id: agent.id,
                name: agent.name,
                role: agent.role,
                shopName: agent.shop?.name || "Unassigned",
                isOnline,
                lastSeen: agent.lastSeen,
                salesToday: agent._count.sales,
                attendanceStatus: lastAttendance
                    ? (lastAttendance.checkOut ? 'CLOCKED_OUT' : 'CLOCKED_IN')
                    : 'ABSENT',
                clockInTime: lastAttendance?.checkIn || null
            };
        });

        return NextResponse.json(formatted);

    } catch (error) {
        console.error("AGENTS LIST ERROR:", error);
        return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
    }
}
