import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Only Admins can see Audit Logs
        const role = (session.user as any).role;
        if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const logs = await prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100, // Limit for now
            include: {
                user: { select: { name: true, role: true } }
            }
        });

        return NextResponse.json(logs);

    } catch (error) {
        console.error("❌ AUDIT_API_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
