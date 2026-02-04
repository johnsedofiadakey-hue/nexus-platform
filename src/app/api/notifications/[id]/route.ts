import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH: Mark as Read
export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = params;

        const notification = await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });

        return NextResponse.json(notification);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
    }
}
