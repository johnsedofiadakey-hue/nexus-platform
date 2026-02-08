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

        // ⚡️ OPTIMIZED: Fetch agents with only required fields
        const agents = await prisma.user.findMany({
            where: {
                organizationId: session.user.organizationId,
                role: { in: ['WORKER', 'MANAGER'] },
                status: 'ACTIVE'
            },
            select: {
                id: true,
                name: true,
                role: true,
                lastSeen: true,
                shop: { 
                    select: { 
                        name: true 
                    } 
                },
                attendance: {
                    where: { date: { gte: today } },
                    orderBy: { checkIn: 'desc' },
                    take: 1,
                    select: {
                        checkIn: true,
                        checkOut: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        // ⚡️ OPTIMIZED: Batch fetch sales counts for all agents
        const salesCounts = await prisma.sale.groupBy({
            by: ['userId'],
            where: {
                userId: { in: agents.map(a => a.id) },
                createdAt: { gte: today }
            },
            _count: true
        });

        // Create a map for quick lookup
        const salesMap = new Map(salesCounts.map(s => [s.userId, s._count]));

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
                salesToday: salesMap.get(agent.id) || 0,
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
