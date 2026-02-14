import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fail, ok } from "@/lib/platform/api-response";
import { getTenantEnforcement } from "@/lib/platform/tenant-enforcement";
import { checkFeature } from "@/lib/platform/feature-guard";

export const dynamic = "force-dynamic";

type SessionUserLike = {
  email?: string | null;
  organizationId?: string | null;
};

type SessionLike = {
  user?: SessionUserLike;
} | null;

type EnforcementDeps = {
  getTenantEnforcementFn?: typeof getTenantEnforcement;
  checkFeatureFn?: typeof checkFeature;
};

export async function buildEnforcementResponse(
  req: Request,
  session: SessionLike,
  deps: EnforcementDeps = {}
) {
  if (!session?.user?.email) {
    return fail("UNAUTHORIZED", "Unauthorized", 401);
  }

  const organizationId = session.user.organizationId || null;
  const getTenantEnforcementFn = deps.getTenantEnforcementFn || getTenantEnforcement;
  const checkFeatureFn = deps.checkFeatureFn || checkFeature;

  const enforcement = await getTenantEnforcementFn(organizationId);

  const featureKey = new URL(req.url).searchParams.get("featureKey");
  if (!featureKey || !organizationId) {
    return ok(enforcement);
  }

  const featureEnabled = await checkFeatureFn({
    featureKey,
    tenantId: organizationId,
    plan: enforcement.planName,
  });

  return ok({ ...enforcement, featureEnabled, featureKey });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  return buildEnforcementResponse(req, session as SessionLike);
}
