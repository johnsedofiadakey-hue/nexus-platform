import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for API routes that use database
export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { image } = body;

        if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

        await prisma.user.update({
            where: { email: session.user.email },
            data: { image }
        });

        return NextResponse.json({ success: true });

    } catch (e) {
        return NextResponse.json({ error: "Update Failed" }, { status: 500 });
    }
}
