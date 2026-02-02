import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Fetch Active Agents (Seen in last 5 mins)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        // TODO: Filter by Organization for Multi-tenant
        const activeAgents = await prisma.user.findMany({
            where: {
                role: "WORKER", // or AGENT
                // organizationId: session.user.organizationId
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

        // 2. Calculate Stats
        const onlineCount = activeAgents.filter(a => a.lastSeen && a.lastSeen > fiveMinutesAgo).length;

        // 3. Today's Sales
        const sales = await prisma.sale.findMany({
            where: {
                createdAt: { gte: today }
            },
            select: { totalAmount: true }
        });
        const totalSales = sales.reduce((acc, s) => acc + s.totalAmount, 0);

        // 4. Shop Count
        const shopCount = await prisma.shop.count({
            where: { status: "ACTIVE" }
        });

        return NextResponse.json({
            agents: activeAgents.map(a => ({
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
                totalSales,
                activeShops: shopCount
            }
        });

    } catch (error) {
        console.error("DASHBOARD STATS ERROR:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
