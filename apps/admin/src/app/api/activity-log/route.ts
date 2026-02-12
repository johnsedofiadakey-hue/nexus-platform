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
        const requestedShopId = searchParams.get("shopId");

        // 🔢 SAFE PARSING: Prevent NaN crashes
        const limitStr = searchParams.get("limit");
        const offsetStr = searchParams.get("offset");
        const limit = limitStr ? Math.min(parseInt(limitStr) || 100, 500) : 100;
        const offset = offsetStr ? Math.max(parseInt(offsetStr) || 0, 0) : 0;

        // 🏗️ Build filter conditions
        const where: any = {};
        if (userId) where.userId = userId;
        if (action) where.action = action;
        if (entity) where.entity = entity;

        // 🛡️ MULTI-TENANCY: Enforce organization isolation
        const userRole = (session.user as any).role;
        const orgId = (session.user as any).organizationId;

        if (userRole !== 'SUPER_ADMIN') {
            if (!orgId) {
                return NextResponse.json({ error: "Organization context missing" }, { status: 400 });
            }

            // Fetch shops belonging to this organization
            const userShops = await prisma.shop.findMany({
                where: { organizationId: orgId },
                select: { id: true }
            });
            const shopIds = userShops.map(s => s.id);

            if (requestedShopId) {
                // If specific shop requested, verify it belongs to user's org
                if (!shopIds.includes(requestedShopId)) {
                    return NextResponse.json({ error: "Access denied to requested hub" }, { status: 403 });
                }
                where.shopId = requestedShopId;
            } else {
                // Otherwise, restrict to all org shops
                where.shopId = { in: shopIds };
            }
        } else if (requestedShopId) {
            // SUPER_ADMIN can see any requested shop
            where.shopId = requestedShopId;
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
        console.error("❌ ACTIVITY_LOG_SERVER_ERROR:", error);
        return NextResponse.json({
            error: "Failed to load activity stream",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
