import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// POST: Sync all active targets with actual sales data
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only admins can sync targets
        if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Fetch all active targets
        const activeTargets = await prisma.target.findMany({
            where: { status: 'ACTIVE' },
            include: { user: true }
        });

        const syncResults = [];

        for (const target of activeTargets) {
            // Calculate actual sales within target period
            const sales = await prisma.sale.aggregate({
                where: {
                    userId: target.userId,
                    createdAt: {
                        gte: target.startDate,
                        lte: target.endDate
                    }
                },
                _sum: {
                    totalAmount: true,
                }
            });

            // Also count total items sold
            const itemCount = await prisma.saleItem.aggregate({
                where: {
                    sale: {
                        userId: target.userId,
                        createdAt: {
                            gte: target.startDate,
                            lte: target.endDate
                        }
                    }
                },
                _sum: {
                    quantity: true
                }
            });

            const achievedValue = sales._sum.totalAmount || 0;
            const achievedQuantity = itemCount._sum.quantity || 0;

            // Update target with actual data
            const updated = await prisma.target.update({
                where: { id: target.id },
                data: {
                    achievedValue,
                    achievedQuantity,
                    // Auto-update status based on achievement and date
                    status: determineStatus(
                        target.targetValue,
                        achievedValue,
                        target.targetQuantity,
                        achievedQuantity,
                        target.endDate
                    )
                }
            });

            // Log progress update
            await prisma.targetHistory.create({
                data: {
                    targetId: target.id,
                    userId: session.user.id,
                    action: 'PROGRESS_UPDATE',
                    previousValue: {
                        achievedValue: target.achievedValue,
                        achievedQuantity: target.achievedQuantity
                    },
                    newValue: {
                        achievedValue,
                        achievedQuantity
                    },
                    progress: calculateProgress(target.targetValue, achievedValue, target.targetQuantity, achievedQuantity),
                    achievedValue,
                    achievedQuantity,
                    notes: 'Auto-synced from sales data'
                }
            });

            syncResults.push({
                targetId: target.id,
                userName: target.user.name,
                previousAchieved: { value: target.achievedValue, quantity: target.achievedQuantity },
                newAchieved: { value: achievedValue, quantity: achievedQuantity },
                status: updated.status
            });
        }

        return NextResponse.json({
            success: true,
            message: `Synced ${syncResults.length} targets`,
            results: syncResults
        });

    } catch (error: any) {
        console.error('Target Sync Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Helper function to determine status
function determineStatus(
    targetValue: number,
    achievedValue: number,
    targetQuantity: number,
    achievedQuantity: number,
    endDate: Date
): string {
    const now = new Date();
    const valueProgress = (achievedValue / targetValue) * 100;
    const quantityProgress = (achievedQuantity / targetQuantity) * 100;
    const avgProgress = (valueProgress + quantityProgress) / 2;

    // If end date passed
    if (now > endDate) {
        return avgProgress >= 100 ? 'COMPLETED' : 'FAILED';
    }

    // If target met before end date
    if (avgProgress >= 100) {
        return 'COMPLETED';
    }

    return 'ACTIVE';
}

// Helper function to calculate progress percentage
function calculateProgress(
    targetValue: number,
    achievedValue: number,
    targetQuantity: number,
    achievedQuantity: number
): number {
    const valueProgress = targetValue > 0 ? (achievedValue / targetValue) * 100 : 0;
    const quantityProgress = targetQuantity > 0 ? (achievedQuantity / targetQuantity) * 100 : 0;
    return (valueProgress + quantityProgress) / 2;
}
