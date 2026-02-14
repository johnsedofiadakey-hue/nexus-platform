import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/require-platform-admin";
import { logPlatformAction } from "@/lib/platform-audit";

export const dynamic = "force-dynamic";

const toggleSchema = z.object({
  key: z.string().min(1),
  enabledGlobally: z.boolean(),
  planRestrictions: z.array(z.string()).optional(),
  tenantOverrides: z.record(z.boolean()).optional(),
});

export async function GET() {
  try {
    await requirePlatformAdmin();
    const flags = await prisma.featureFlag.findMany({ orderBy: { key: "asc" } });
    return Response.json({ success: true, data: flags });
  } catch {
    return Response.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requirePlatformAdmin();
    const payload = toggleSchema.parse(await req.json());

    const flag = await prisma.featureFlag.upsert({
      where: { key: payload.key },
      update: {
        enabledGlobally: payload.enabledGlobally,
        planRestrictions: payload.planRestrictions || [],
        tenantOverrides: payload.tenantOverrides,
      },
      create: {
        key: payload.key,
        enabledGlobally: payload.enabledGlobally,
        planRestrictions: payload.planRestrictions || [],
        tenantOverrides: payload.tenantOverrides,
      },
    });

    await logPlatformAction({
      adminId: admin.id,
      actionType: "FEATURE_TOGGLED",
      metadata: { key: payload.key, enabledGlobally: payload.enabledGlobally },
    });

    return Response.json({ success: true, data: flag });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ success: false, error: { code: "VALIDATION", message: error.message } }, { status: 400 });
    }
    return Response.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
  }
}
