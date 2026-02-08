import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Aggregate sales by shop and category
    const sales = await prisma.sale.findMany({
      include: {
        shop: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    // Process data for the chart (Grouped by Hub and Product Category)
    const analytics = sales.reduce((acc: any, sale: any) => {
      const shopName = sale.shop.name;
      const items = JSON.parse(sale.items as string);
      
      items.forEach((item: any) => {
        const key = `${shopName}-${item.category || 'General'}`;
        if (!acc[key]) {
          acc[key] = { hub: shopName, category: item.category || 'General', total: 0 };
        }
        acc[key].total += sale.totalAmount;
      });
      return acc;
    }, {});

    return NextResponse.json({ 
      success: true, 
      data: Object.values(analytics),
      totalRevenue: sales.reduce((sum, s) => sum + s.totalAmount, 0)
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}