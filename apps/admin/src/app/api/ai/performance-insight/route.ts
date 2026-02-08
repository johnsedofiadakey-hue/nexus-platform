import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                sales: {
                    orderBy: { createdAt: 'desc' },
                    take: 50
                },
                attendance: {
                    orderBy: { checkIn: 'desc' },
                    take: 20
                },
                targets: {
                    where: { status: 'ACTIVE' },
                    take: 1
                },
                dailyReports: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const insights = generateInsights(user);
        return NextResponse.json(insights);

    } catch (error) {
        console.error("AI_INSIGHT_ERROR:", error);
        return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
    }
}

function generateInsights(user: any) {
    const sales = user.sales || [];
    const attendance = user.attendance || [];
    const target = user.targets?.[0];
    const reports = user.dailyReports || [];

    // 1. Calculate Core Metrics
    const totalSales = sales.reduce((sum: number, s: any) => sum + s.totalAmount, 0);
    const totalUnits = sales.length;
    const avgOrderValue = totalUnits > 0 ? totalSales / totalUnits : 0;

    const targetSalesGap = target ? Math.max(0, target.targetValue - totalSales) : 0;
    const targetSalesProgress = target ? (totalSales / target.targetValue) * 100 : 0;

    const lateCheckins = attendance.filter((a: any) => {
        const hour = new Date(a.checkIn).getHours();
        return hour > 9; // Assuming 9 AM start
    }).length;

    // 2. Intelligence Heuristics
    let briefing = "";
    let tone = "informational";
    const recommendations = [];

    if (target) {
        if (targetSalesProgress >= 90) {
            briefing = `${user.name} is performing exceptionally well, having achieved ${targetSalesProgress.toFixed(1)}% of the sales target. `;
            tone = "positive";
            recommendations.push("Consider increasing targets for the next period to maintain momentum.");
        } else if (targetSalesProgress < 40) {
            briefing = `${user.name} is significantly behind sales targets (${targetSalesProgress.toFixed(1)}%). `;
            tone = "urgent";
            recommendations.push("Schedule a 1-on-1 review to identify blockers in the sales funnel.");
        } else {
            briefing = `${user.name} is on a steady trajectory with ${targetSalesProgress.toFixed(1)}% target completion. `;
            tone = "neutral";
        }
    } else {
        briefing = `No active targets set for ${user.name}. Currently maintaining a sales volume of ${totalUnits} units. `;
    }

    // Attendance Insights
    if (lateCheckins > 2) {
        briefing += `Consistency issues detected: ${lateCheckins} late check-ins in the last 20 shifts. `;
        recommendations.push("Address morning punctuality to maximize early-hour walk-ins.");
    }

    // Sales Quality Insights
    if (avgOrderValue < 500 && totalUnits > 10) {
        briefing += `Focus appears to be on high-volume, low-value inventory. `;
        recommendations.push("Coach on cross-selling premium accessories to increase Average Order Value.");
    }

    // Report Intel
    if (reports.length > 0) {
        const lastReport = reports[0];
        if (lastReport.marketIntel) {
            briefing += `Active in field intelligence gathering (latest report submitted ${new Date(lastReport.createdAt).toLocaleDateString()}).`;
        }
    }

    return {
        briefing,
        tone,
        metrics: {
            salesProgress: targetSalesProgress,
            avgOrderValue,
            consistencyScore: Math.max(0, 100 - (lateCheckins * 10))
        },
        recommendations
    };
}
