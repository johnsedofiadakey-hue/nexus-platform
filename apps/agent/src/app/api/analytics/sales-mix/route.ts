import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET() {
  try {
    // 🔐 Require authentication
    const user = await requireAuth();
    
    // 🏢 Build organization filter
    const orgFilter = user.role === "SUPER_ADMIN" && !user.organizationId
      ? {} : { organizationId: user.organizationId };

    // Aggregate sales by shop and category
    const sales = await prisma.sale.findMany({
      where: {
        shop: orgFilter
      },
      include: {
        shop: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    // Process data for the chart (Grouped by Hub and Product Category)
    const analytics = sales.reduce((acc: any, sale: any) => {
      const shopName = sale.shop.name;
      
      // 🛡️ Safe JSON parsing
      let items: any[] = [];
      try {
        items = JSON.parse(sale.items as string);
      } catch (e) {
        console.error('Failed to parse sale items:', e);
        return acc;
      }
      
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