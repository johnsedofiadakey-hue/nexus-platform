import { prisma } from "@/lib/prisma";

// ── Model scoping categories ──────────────────────────────────────────
// Organization itself: filter by { id: orgId }
// directOrgModels: have organizationId column → { organizationId: orgId }
const directOrgModels = new Set([
  "Shop",
  "User",
  "Notification",
  "Invoice",
]);

// tenantIdDirectModels: have tenantId column → { tenantId: orgId }
const tenantIdDirectModels = new Set(["Subscription"]);

// viaShopModels: have shop relation → { shop: { organizationId: orgId } }
const viaShopModels = new Set([
  "Product", "Sale", "Customer", "Expense", "InventoryCategory",
  "SaleItem",  // sale → shop → org
]);

// viaUserModels: have user relation → { user: { organizationId: orgId } }
const viaUserModels = new Set([
  "Attendance",
  "DailyReport",
  "LeaveRequest",
  "DisciplinaryRecord",
  "Target",
  "AuditLog",
]);

// viaSenderModels: have sender relation → { sender: { organizationId: orgId } }
const viaSenderModels = new Set(["Message"]);

// Models that are scoped at the route level (no automatic scoping):
// - ActivityLog: has plain shopId/userId strings, no Prisma relation; route does its own shop-based filtering
// - TargetHistory: scoped through target → user → org at route level

function mergeWhere(baseWhere: any, scopedWhere: any) {
  if (!baseWhere) return scopedWhere;
  return { AND: [baseWhere, scopedWhere] };
}

// For findUnique, we can't use AND — Prisma requires unique fields at top level.
// Instead, spread the scope filter directly into where.
function mergeWhereForUnique(baseWhere: any, scopedWhere: any) {
  if (!baseWhere) return scopedWhere;
  return { ...baseWhere, ...scopedWhere };
}

export function injectOrganizationIdIfMissing<T extends { organizationId?: string; organization?: unknown }>(
  data: T | null | undefined,
  orgId: string
): T | null | undefined {
  if (!data || data.organizationId || data.organization) {
    return data;
  }

  return {
    ...data,
    organizationId: orgId,
  };
}

export function createScopedPrisma(orgId: string | null, role: string | undefined) {
  if (role === "SUPER_ADMIN" && !orgId) {
    return prisma;
  }

  if (!orgId) {
    return prisma;
  }

  const readOps = new Set(["findMany", "findFirst", "findUnique", "count", "aggregate", "groupBy", "updateMany", "deleteMany"]);

  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: any) {
          if (!model || !args) {
            return query(args);
          }

          if (readOps.has(operation)) {
            // Choose merge strategy: findUnique can't use AND (breaks unique constraint)
            const merge = operation === "findUnique" ? mergeWhereForUnique : mergeWhere;

            if (model === "Organization") {
              // Organization: ensure only own org is accessible
              if (!args.where) args.where = {};
              args.where.id = orgId;
            } else if (tenantIdDirectModels.has(model)) {
              args.where = merge(args.where, { tenantId: orgId });
            } else if (directOrgModels.has(model)) {
              args.where = merge(args.where, { organizationId: orgId });
            } else if (viaShopModels.has(model)) {
              // SaleItem goes through sale → shop
              if (model === "SaleItem") {
                args.where = merge(args.where, { sale: { shop: { organizationId: orgId } } });
              } else {
                args.where = merge(args.where, { shop: { organizationId: orgId } });
              }
            } else if (viaUserModels.has(model)) {
              args.where = merge(args.where, { user: { organizationId: orgId } });
            } else if (viaSenderModels.has(model)) {
              // Message: scope so user sees messages where they are sender OR receiver within org
              args.where = merge(args.where, {
                OR: [
                  { sender: { organizationId: orgId } },
                  { receiver: { organizationId: orgId } },
                ],
              });
            }
          }

          if (["create", "createMany"].includes(operation)) {
            if (directOrgModels.has(model)) {
              if (operation === "createMany" && Array.isArray(args.data)) {
                args.data = args.data.map((row: any) => injectOrganizationIdIfMissing(row, orgId));
              } else {
                args.data = injectOrganizationIdIfMissing(args.data, orgId);
              }
            } else if (tenantIdDirectModels.has(model)) {
              args.data = {
                ...args.data,
                tenantId: args.data?.tenantId ?? orgId,
              };
            }
          }

          return query(args);
        },
      },
    },
  });
}
