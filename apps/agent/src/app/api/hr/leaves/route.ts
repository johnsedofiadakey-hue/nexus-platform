import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for API routes that use database
export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/sessionUser";

// POST: Submit a Leave Request (Mobile/Self-Service)
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await resolveSessionUser(session);
        if (!user) {
            return NextResponse.json({ error: "User context not found" }, { status: 401 });
        }

        const body = await req.json();
        const { type, startDate, endDate, reason } = body;

        if (!type || !startDate || !endDate) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const leave = await prisma.leaveRequest.create({
            data: {
                userId: user.id, // Inferred from Session
                type,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason: reason || "",
                status: "PENDING"
            }
        });

        return NextResponse.json(leave);

    } catch (error) {
        console.error("LEAVE_REQ_ERROR:", error);
        return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
    }
}
