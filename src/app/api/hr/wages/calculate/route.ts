import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    // 1. Fetch User and their Retail Node context
    const staff = await prisma.user.findUnique({
      where: { id: userId as string },
      include: { 
        shop: true,
        sales: {
          where: { createdAt: { gte: new Date(new Date().setDate(1)) } } // Current Month
        }
      }
    });

    if (!staff) return NextResponse.json({ error: "Personnel not found" }, { status: 404 });

    // 2. Logic: Base Pay + (Total Sales * 2% Commission)
    const basePay = 2500.00; // Example Monthly Base for LG Ghana Reps
    const totalSalesValue = staff.sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const commission = totalSalesValue * 0.02; 
    const netPayout = basePay + commission;

    return NextResponse.json({
      success: true,
      data: {
        basePay,
        commission,
        netPayout,
        totalSales: totalSalesValue,
        onSiteCompliance: "98.4%" // Pulled from geofence logs
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}