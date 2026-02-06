import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity, logTargetActivity, getClientIp, getUserAgent } from "@/lib/activity-logger";

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
        const includeHistory = searchParams.get("includeHistory") === "true";

        const targets = await prisma.target.findMany({
            where: userId ? { userId } : (isSuperAdmin ? {} : { user: { organizationId: session.user.organizationId } }),
            include: { 
                user: { select: { name: true, image: true, shop: { select: { name: true } } } },
                history: includeHistory ? { orderBy: { createdAt: 'desc' }, take: 50 } : false
            },
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

        // Fetch target user for shop info
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { shop: true }
        });

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

        // Log target creation in history
        await logTargetActivity(
            target.id,
            session.user.id,
            "CREATED",
            null,
            {
                targetQuantity: target.targetQuantity,
                targetValue: target.targetValue,
                startDate: target.startDate,
                endDate: target.endDate,
            },
            0,
            0,
            0,
            `Target created by ${session.user.name}`
        );

        // Log in master activity log
        await logActivity({
            userId: session.user.id,
            userName: session.user.name || "Unknown",
            userRole: session.user.role || "USER",
            action: "TARGET_CREATED",
            entity: "Target",
            entityId: target.id,
            description: `Created target for ${targetUser?.name}: ₵${targetValue} / ${targetQuantity} units`,
            metadata: { targetId: target.id, userId, targetQuantity, targetValue },
            ipAddress: getClientIp(req),
            userAgent: getUserAgent(req),
            shopId: targetUser?.shopId,
            shopName: targetUser?.shop?.name,
        });

        return NextResponse.json(target);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH: Update Target
export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { targetId, targetQuantity, targetValue, startDate, endDate, status } = body;

        // Get existing target
        const existingTarget = await prisma.target.findUnique({
            where: { id: targetId },
            include: { user: { include: { shop: true } } }
        });

        if (!existingTarget) {
            return NextResponse.json({ error: "Target not found" }, { status: 404 });
        }

        // Update target
        const updatedTarget = await prisma.target.update({
            where: { id: targetId },
            data: {
                ...(targetQuantity !== undefined && { targetQuantity: parseInt(targetQuantity) }),
                ...(targetValue !== undefined && { targetValue: parseFloat(targetValue) }),
                ...(startDate && { startDate: new Date(startDate) }),
                ...(endDate && { endDate: new Date(endDate) }),
                ...(status && { status }),
            }
        });

        // Log target update in history
        await logTargetActivity(
            targetId,
            session.user.id,
            "UPDATED",
            {
                targetQuantity: existingTarget.targetQuantity,
                targetValue: existingTarget.targetValue,
                startDate: existingTarget.startDate,
                endDate: existingTarget.endDate,
                status: existingTarget.status,
            },
            {
                targetQuantity: updatedTarget.targetQuantity,
                targetValue: updatedTarget.targetValue,
                startDate: updatedTarget.startDate,
                endDate: updatedTarget.endDate,
                status: updatedTarget.status,
            },
            0,
            0,
            0,
            `Target updated by ${session.user.name}`
        );

        // Log in master activity log
        await logActivity({
            userId: session.user.id,
            userName: session.user.name || "Unknown",
            userRole: session.user.role || "USER",
            action: "TARGET_UPDATED",
            entity: "Target",
            entityId: targetId,
            description: `Updated target for ${existingTarget.user.name}`,
            metadata: { targetId, changes: body },
            ipAddress: getClientIp(req),
            userAgent: getUserAgent(req),
            shopId: existingTarget.user.shopId,
            shopName: existingTarget.user.shop?.name,
        });

        return NextResponse.json(updatedTarget);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Delete Target
export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const targetId = searchParams.get("targetId");

        if (!targetId) {
            return NextResponse.json({ error: "Target ID required" }, { status: 400 });
        }

        // Get existing target before deletion
        const existingTarget = await prisma.target.findUnique({
            where: { id: targetId },
            include: { user: { include: { shop: true } } }
        });

        if (!existingTarget) {
            return NextResponse.json({ error: "Target not found" }, { status: 404 });
        }

        // Log target deletion in history (before deleting)
        await logTargetActivity(
            targetId,
            session.user.id,
            "DELETED",
            {
                targetQuantity: existingTarget.targetQuantity,
                targetValue: existingTarget.targetValue,
                startDate: existingTarget.startDate,
                endDate: existingTarget.endDate,
                status: existingTarget.status,
            },
            null,
            0,
            0,
            0,
            `Target deleted by ${session.user.name}`
        );

        // Delete target (cascade will handle history)
        await prisma.target.delete({
            where: { id: targetId }
        });

        // Log in master activity log
        await logActivity({
            userId: session.user.id,
            userName: session.user.name || "Unknown",
            userRole: session.user.role || "USER",
            action: "TARGET_DELETED",
            entity: "Target",
            entityId: targetId,
            description: `Deleted target for ${existingTarget.user.name}`,
            metadata: { targetId, deletedTarget: existingTarget },
            ipAddress: getClientIp(req),
            userAgent: getUserAgent(req),
            shopId: existingTarget.user.shopId,
            shopName: existingTarget.user.shop?.name,
        });

        return NextResponse.json({ success: true, message: "Target deleted" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

