import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for API routes that use database
export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const orgFilter = (session.user.role === "SUPER_ADMIN" && !session.user.organizationId)
            ? {}
            : { organizationId: session.user.organizationId };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Fetch Agents for detailed breakdown (PROMOTERS ONLY) - Multi-tenant
        const allPromoters = await prisma.user.findMany({
            where: {
                ...orgFilter,
                role: { in: ['PROMOTER', 'AGENT', 'WORKER', 'ASSISTANT'] },
                status: "ACTIVE"
            },
            select: {
                id: true,
                name: true,
                lastLat: true,
                lastLng: true,
                lastSeen: true,
                status: true,
                shop: {
                    select: { name: true }
                }
            }
        });

        // 2. Calculate Detailed Stats
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const onlineCount = allPromoters.filter(a => a.lastSeen && a.lastSeen > fiveMinutesAgo).length;
        const offlineCount = allPromoters.length - onlineCount;

        // 3. Today's Sales Analytics - Multi-tenant
        const salesStats = await prisma.sale.aggregate({
            where: {
                createdAt: { gte: today },
                shop: orgFilter // Filter sales via shop organization
            },
            _sum: {
                totalAmount: true
            },
            _count: {
                id: true
            }
        });

        // 4. Top Performers (Leaderboard) - Multi-tenant
        const topPerformersData = await prisma.sale.groupBy({
            by: ['userId'],
            where: {
                createdAt: { gte: today },
                shop: orgFilter
            },
            _sum: {
                totalAmount: true
            },
            _count: {
                id: true
            },
            orderBy: {
                _sum: {
                    totalAmount: 'desc'
                }
            },
            take: 5
        });

        // Fetch names for top performers
        const performerIds = topPerformersData.map(p => p.userId);
        const performers = await prisma.user.findMany({
            where: { id: { in: performerIds } },
            select: { id: true, name: true, image: true }
        });

        const topPerformers = topPerformersData.map(p => {
            const user = performers.find(u => u.id === p.userId);
            return {
                id: p.userId,
                name: user?.name || "Unknown",
                image: user?.image,
                totalSales: p._sum.totalAmount || 0,
                transactionCount: p._count.id
            };
        });

        // 5. Shop Count (Strict Multi-Tenancy)
        const shopCount = await prisma.shop.count({
            where: {
                ...orgFilter,
                status: "ACTIVE"
            }
        });

        return NextResponse.json({
            agents: allPromoters.map(a => ({
                id: a.id,
                name: a.name,
                location: a.shop?.name || "Roaming",
                status: (a.lastSeen && a.lastSeen > fiveMinutesAgo) ? "ONLINE" : "OFFLINE",
                lat: a.lastLat,
                lng: a.lastLng,
                lastSeen: a.lastSeen
            })),
            stats: {
                onlineAgents: onlineCount,
                offlineAgents: offlineCount,
                totalPromoters: allPromoters.length,
                totalSales: salesStats._sum.totalAmount || 0,
                totalTransactions: salesStats._count.id,
                activeShops: shopCount,
                topPerformers
            }
        });

    } catch (error) {
        console.error("DASHBOARD STATS ERROR:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
