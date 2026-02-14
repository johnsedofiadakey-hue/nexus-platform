import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, RateLimitError, UnauthorizedError } from "./errors";
import { createScopedPrisma } from "./scoped-prisma";
import { checkSlidingWindow, clientIpFromRequest, RateLimitRule } from "./rate-limit";
import { withLogContext } from "./logger";
import { getTenantEnforcement } from "./tenant-enforcement";
import { checkFeature, featureKeyFromRoute } from "./feature-guard";

const sensitiveDefaultRate: RateLimitRule = {
  keyPrefix: "user-protected",
  max: 80,
  windowMs: 60_000,
};

export type TenantProtectionOptions = {
  route: string;
  roles?: string[];
  requireShopId?: boolean;
  rateLimit?: RateLimitRule;
  allowWhenLocked?: boolean;
  featureKey?: string;
};

export type TenantContext = {
  sessionUser: {
    id: string;
    email: string;
    role: string;
    organizationId: string | null;
    shopId: string | null;
    tenantStatus: string | null;
  };
  orgId: string | null;
  shopId: string | null;
  scopedPrisma: ReturnType<typeof createScopedPrisma>;
  requestId: string;
  ip: string;
  log: ReturnType<typeof withLogContext>;
};

function requestIdFromRequest(req: Request): string {
  return req.headers.get("x-request-id") || crypto.randomUUID();
}

export function withTenantProtection(
  options: TenantProtectionOptions,
  handler: (req: Request, ctx: TenantContext) => Promise<Response>
) {
  return async function wrapped(req: Request): Promise<Response> {
    const requestId = requestIdFromRequest(req);
    const ip = clientIpFromRequest(req);

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new UnauthorizedError("Authentication required");
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        role: true,
        organizationId: true,
        shopId: true,
        organization: { select: { status: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedError("Session user not found");
    }

    if (options.roles && !options.roles.includes(user.role)) {
      throw new ForbiddenError("Insufficient role permissions");
    }

    const tenantStatus = user.organization?.status || null;
    if (user.role !== "SUPER_ADMIN" && tenantStatus !== "ACTIVE") {
      throw new ForbiddenError("Tenant is suspended or inactive");
    }

    const enforcement = await getTenantEnforcement(user.organizationId);
    if (
      user.role !== "SUPER_ADMIN" &&
      enforcement.subscriptionStatus === "LOCKED" &&
      !options.allowWhenLocked
    ) {
      throw new ForbiddenError("Tenant subscription is locked");
    }

    const resolvedFeatureKey = options.featureKey || featureKeyFromRoute(options.route);
    if (resolvedFeatureKey && user.organizationId) {
      const subscription = await prisma.subscription.findFirst({
        where: { tenantId: user.organizationId },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      });

      const planName = subscription?.plan?.name || "Starter";
      const hasFeature = await checkFeature({
        featureKey: resolvedFeatureKey,
        tenantId: user.organizationId,
        plan: planName,
      });

      if (!hasFeature) {
        throw new ForbiddenError(`Feature \"${resolvedFeatureKey}\" is not enabled for this tenant`);
      }
    }

    const routeRate = options.rateLimit || sensitiveDefaultRate;
    const userRate = checkSlidingWindow(routeRate, user.id);
    if (!userRate.allowed) {
      throw new RateLimitError("Rate limit exceeded for user");
    }

    const url = new URL(req.url);
    const routeShopId = url.searchParams.get("shopId");
    const bodyShopId = req.method !== "GET" ? undefined : undefined;
    const resolvedShopId = routeShopId || bodyShopId || user.shopId;

    if (options.requireShopId && !resolvedShopId) {
      throw new ForbiddenError("shopId is required for this route");
    }

    if (resolvedShopId && user.role !== "SUPER_ADMIN") {
      const shop = await prisma.shop.findUnique({
        where: { id: resolvedShopId },
        select: { organizationId: true },
      });

      if (!shop || shop.organizationId !== user.organizationId) {
        throw new ForbiddenError("Shop does not belong to your organization");
      }
    }

    const log = withLogContext({
      requestId,
      route: options.route,
      userId: user.id,
      orgId: user.organizationId,
      ip,
    });

    log.info({ method: req.method }, "Protected route access granted");

    return handler(req, {
      requestId,
      ip,
      log,
      orgId: user.organizationId,
      shopId: resolvedShopId,
      scopedPrisma: createScopedPrisma(user.organizationId, user.role),
      sessionUser: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        shopId: user.shopId,
        tenantStatus,
      },
    });
  };
}
