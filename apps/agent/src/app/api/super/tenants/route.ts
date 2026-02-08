import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        // 🔐 Super Admin Authorization
        if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
        }

        const organizations = await prisma.organization.findMany({
            include: {
                _count: {
                    select: { shops: true, users: true }
                }
            }
        });

        const tenants = organizations.map(org => ({
            id: org.id,
            name: org.name,
            status: org.status,
            users: org._count.users,
            shops: org._count.shops,
            plan: org.plan
        }));

        return NextResponse.json(tenants);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 });
    }
}
