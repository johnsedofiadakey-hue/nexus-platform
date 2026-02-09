import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for API routes that use database
export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// 1. POST: Submit a Leave Request
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { type, startDate, endDate, reason, userId } = body;

        if (!type || !startDate || !endDate || !userId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Security: Only allow creating for users in your Organization
        const targetUser = await prisma.user.findFirst({
            where: { id: userId, organizationId: session.user.organizationId }
        });

        if (!targetUser) {
            return NextResponse.json({ error: "Target user not found or access denied" }, { status: 403 });
        }

        const leave = await prisma.leaveRequest.create({
            data: {
                userId,
                type,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason: reason || "",
                status: "PENDING"
            }
        });

        // 🔔 NOTIFICATION TRIGGER
        if (targetUser && session.user.organizationId) {
            await prisma.notification.create({
                data: {
                    organizationId: session.user.organizationId,
                    type: 'LEAVE',
                    title: 'New Leave Request',
                    message: `${targetUser.name || 'Staff'}: Requested ${type.replace('_', ' ')} (${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()})`,
                    link: `/dashboard/hr/member/${userId}?tab=COMPLIANCE`
                }
            });
        }

        return NextResponse.json(leave);

    } catch (error) {
        console.error("LEAVE_REQ_ERROR:", error);
        return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
    }
}

// 2. PATCH: Approve or Reject
export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { leaveId, status } = body;

        if (!leaveId || !['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
            return NextResponse.json({ error: "Invalid Request" }, { status: 400 });
        }

        // Verify the leave belongs to a user in my org
        // We need to fetch the leave and include the user to check org
        const leave = await prisma.leaveRequest.findUnique({
            where: { id: leaveId },
            include: { user: true }
        });

        if (!leave || leave.user.organizationId !== session.user.organizationId) {
            return NextResponse.json({ error: "Leave not found or unauthorized" }, { status: 403 });
        }

        const updated = await prisma.leaveRequest.update({
            where: { id: leaveId },
            data: { status }
        });

        return NextResponse.json(updated);

    } catch (error) {
        console.error("LEAVE_UPDATE_ERROR:", error);
        return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
    }
}
