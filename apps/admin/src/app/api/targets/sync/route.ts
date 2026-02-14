import { withTenantProtection } from "@/lib/platform/tenant-protection";
import { withApiErrorHandling } from "@/lib/platform/error-handler";
import { ok } from "@/lib/platform/api-response";

export const dynamic = "force-dynamic";

const protectedPost = withTenantProtection(
    {
        route: "/api/targets/sync",
        roles: ["ADMIN", "SUPER_ADMIN"],
        rateLimit: { keyPrefix: "targets-sync-write", max: 10, windowMs: 60_000 },
    },
    async (_req, ctx) => {
        const activeTargets = await ctx.scopedPrisma.target.findMany({
            where: { status: "ACTIVE" },
            include: { user: true },
        });

        const syncResults: Array<{
            targetId: string;
            userName: string | null;
            previousAchieved: { value: number; quantity: number };
            newAchieved: { value: number; quantity: number };
            status: string;
        }> = [];

        for (const target of activeTargets) {
            const sales = await ctx.scopedPrisma.sale.aggregate({
                where: {
                    userId: target.userId,
                    createdAt: { gte: target.startDate, lte: target.endDate },
                },
                _sum: { totalAmount: true },
            });

            const itemCount = await ctx.scopedPrisma.saleItem.aggregate({
                where: {
                    sale: {
                        userId: target.userId,
                        createdAt: { gte: target.startDate, lte: target.endDate },
                    },
                },
                _sum: { quantity: true },
            });

            const achievedValue = sales._sum.totalAmount || 0;
            const achievedQuantity = itemCount._sum.quantity || 0;

            const updated = await ctx.scopedPrisma.target.update({
                where: { id: target.id },
                data: {
                    achievedValue,
                    achievedQuantity,
                    status: determineStatus(
                        target.targetValue,
                        achievedValue,
                        target.targetQuantity,
                        achievedQuantity,
                        target.endDate
                    ),
                },
            });

            await ctx.scopedPrisma.targetHistory.create({
                data: {
                    targetId: target.id,
                    userId: ctx.sessionUser.id,
                    action: "PROGRESS_UPDATE",
                    previousValue: {
                        achievedValue: target.achievedValue,
                        achievedQuantity: target.achievedQuantity,
                    },
                    newValue: {
                        achievedValue,
                        achievedQuantity,
                    },
                    progress: calculateProgress(target.targetValue, achievedValue, target.targetQuantity, achievedQuantity),
                    achievedValue,
                    achievedQuantity,
                    notes: "Auto-synced from sales data",
                },
            });

            syncResults.push({
                targetId: target.id,
                userName: target.user.name,
                previousAchieved: { value: target.achievedValue, quantity: target.achievedQuantity },
                newAchieved: { value: achievedValue, quantity: achievedQuantity },
                status: updated.status,
            });
        }

        return ok({
            message: `Synced ${syncResults.length} targets`,
            results: syncResults,
        });
    }
);

export async function POST(req: Request) {
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
    return withApiErrorHandling(req, "/api/targets/sync", requestId, () => protectedPost(req));
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
