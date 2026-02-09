import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for API routes that use database
export const dynamic = 'force-dynamic';
import { requireAuth } from "@/lib/auth-helpers";

export async function PATCH(req: Request) {
    try {
        const user = await requireAuth();
        const body = await req.json();
        const { productId, newPrice, reason } = body;

        if (!productId || typeof newPrice !== 'number' || !reason) {
            return NextResponse.json({ error: "Product ID, new price, and reason are required." }, { status: 400 });
        }

        // 1. Fetch the product to verify organization
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: { shop: true }
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found." }, { status: 404 });
        }

        // 🛡️ Security: Ensure user belongs to the same organization
        if (product.shop.organizationId !== user.organizationId && user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Forbidden: Access denied." }, { status: 403 });
        }

        const oldPrice = product.sellingPrice;

        // 2. Perform the update
        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: { sellingPrice: newPrice }
        });

        // 3. Log the change for auditing
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: "PRICE_ADJUSTMENT",
                entity: "Product",
                entityId: productId,
                details: JSON.stringify({
                    productName: product.name,
                    oldPrice,
                    newPrice,
                    reason,
                    shopName: product.shop.name
                })
            }
        });

        return NextResponse.json({
            success: true,
            message: "Price updated and logged.",
            data: updatedProduct
        });

    } catch (error: any) {
        console.error("Price Update Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
