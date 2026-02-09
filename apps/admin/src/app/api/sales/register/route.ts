import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/auth-helpers";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // 🔐 Require authentication
        const user = await requireAuth();

        const { searchParams } = new URL(req.url);
        const shopId = searchParams.get("shopId");
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 100;

        // 🏢 Build filter with tenant isolation
        const where: any = {};

        // If shopId provided, verify it belongs to user's organization
        if (shopId) {
            const shop = await prisma.shop.findUnique({
                where: { id: shopId },
                select: { organizationId: true }
            });

            // Verify shop belongs to user's org (unless super admin)
            if (shop && user.role !== "SUPER_ADMIN") {
                if (shop.organizationId !== user.organizationId) {
                    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
                }
            }
            where.shopId = shopId;
        } else {
            // No shopId: filter by organization
            if (user.role !== "SUPER_ADMIN" && user.organizationId) {
                where.shop = { organizationId: user.organizationId };
            } else if (user.role === "SUPER_ADMIN" && user.organizationId) {
                where.shop = { organizationId: user.organizationId };
            }
            // SUPER_ADMIN without org sees all (no filter)
        }

        const sales = await prisma.sale.findMany({
            where,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                shop: { select: { name: true } },
                user: { select: { name: true, image: true } },
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                modelNumber: true,
                                category: true,
                                brand: true
                            }
                        }
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
