import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch recent notifications for the organization
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    // 🛡️ Guard: Check Role & Org ID
    const orgId = (session?.user as any)?.organizationId;
    const role = (session?.user as any)?.role;

    if (!session || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(role) || !orgId) {
        // If no org ID, they can't have notifications. valid/empty response.
        return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    try {
        const notifications = await prisma.notification.findMany({
            where: {
                organizationId: orgId
            },
            orderBy: { createdAt: 'desc' },
            take: 20 // Limit to last 20
        });

        const unreadCount = await prisma.notification.count({
            where: {
                organizationId: orgId,
                isRead: false
            }
        });

        return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }
}

// POST: Internal Helper to Create Notification (Can be called via fetch or direct Prisma usage in other routes)
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    // Ensure only authenticated users can trigger (or internal system calls)
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { type, title, message, link } = await req.json();

        const notification = await prisma.notification.create({
            data: {
                organizationId: (session.user as any).organizationId,
                type,
                title,
                message,
                link
            }
        });

        return NextResponse.json(notification);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
    }
}
