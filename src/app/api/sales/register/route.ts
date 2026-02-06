import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const shopId = searchParams.get("shopId");
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 100;

        // Build filter
        const where: any = {};
        if (shopId) where.shopId = shopId;

        const sales = await prisma.sale.findMany({
            where,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                shop: { select: { name: true } },
                user: { select: { name: true, image: true } },
                items: {
                    include: {
                        product: { select: { name: true, modelNumber: true } }
                    }
                }
            }
        });

        return NextResponse.json(sales);
    } catch (error) {
        console.error("SALES REGISTER ERROR:", error);
        return NextResponse.json({ error: "Failed to load sales register" }, { status: 500 });
    }
}
