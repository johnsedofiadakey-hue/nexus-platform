import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for API routes that use database
export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { userId, type, severity, description } = body;

        if (!userId || !type || !severity) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Security: Target user must be in same org
        const targetUser = await prisma.user.findFirst({
            where: { id: userId, organizationId: session.user.organizationId }
        });

        if (!targetUser) {
            return NextResponse.json({ error: "User not found or access denied" }, { status: 403 });
        }

        const record = await prisma.disciplinaryRecord.create({
            data: {
                userId,
                type,
                severity,
                description: description || "Manual Citation",
                actionTaken: "WARNING_ISSUED"
            }
        });

        return NextResponse.json(record);

    } catch (error) {
        console.error("CITATION_LOG_ERROR:", error);
        return NextResponse.json({ error: "Failed to log citation" }, { status: 500 });
    }
}
