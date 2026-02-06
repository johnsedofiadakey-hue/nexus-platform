import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only admins can view full activity log
        if (!['ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(session.user.role || '')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const action = searchParams.get("action");
        const entity = searchParams.get("entity");
        const shopId = searchParams.get("shopId");
        const limit = parseInt(searchParams.get("limit") || "100");
        const offset = parseInt(searchParams.get("offset") || "0");

        // Build filter conditions
        const where: any = {};
        if (userId) where.userId = userId;
        if (action) where.action = action;
        if (entity) where.entity = entity;
        if (shopId) where.shopId = shopId;

        // For non-SUPER_ADMIN, only show logs from their organization
        if (session.user.role !== 'SUPER_ADMIN' && session.user.organizationId) {
            // We need to filter by organization - but ActivityLog doesn't have organizationId
            // So we filter by shopId if the user is not a SUPER_ADMIN
            const userShops = await prisma.shop.findMany({
                where: { organizationId: session.user.organizationId },
                select: { id: true }
            });
            const shopIds = userShops.map(s => s.id);
            where.shopId = { in: shopIds };
        }

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            prisma.activityLog.count({ where })
        ]);

        return NextResponse.json({
            success: true,
            data: logs,
            total,
            limit,
            offset,
        });
    } catch (error: any) {
        console.error("❌ Activity Log Fetch Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
