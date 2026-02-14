-- Platform Control Center foundation
-- Safe additive migration with compatibility backfills

DO $$ BEGIN
  CREATE TYPE "PlatformRole" AS ENUM ('OWNER', 'ENGINEER', 'SUPPORT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'ANNUAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'GRACE', 'LOCKED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "authVersion" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "passwordResetRequired" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "Plan" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "pricePerShopMonthly" DOUBLE PRECISION NOT NULL,
  "annualDiscountPercent" DOUBLE PRECISION NOT NULL,
  "features" TEXT[] NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Plan_name_key" ON "Plan"("name");

CREATE TABLE IF NOT EXISTS "PlatformAdmin" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "PlatformRole" NOT NULL DEFAULT 'OWNER',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
  "lockUntil" TIMESTAMP(3),
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformAdmin_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PlatformAdmin_email_key" ON "PlatformAdmin"("email");

CREATE TABLE IF NOT EXISTS "FeatureFlag" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "enabledGlobally" BOOLEAN NOT NULL DEFAULT true,
  "planRestrictions" TEXT[] NOT NULL,
  "tenantOverrides" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FeatureFlag_key_key" ON "FeatureFlag"("key");

CREATE TABLE IF NOT EXISTS "SystemSetting" (
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- Backfill/reshape Subscription
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "planId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "billingCycle" "BillingCycle";
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "graceEndsAt" TIMESTAMP(3);
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "nextBillingDate" TIMESTAMP(3);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'Subscription' AND column_name = 'organizationId'
  ) THEN
    EXECUTE 'UPDATE "Subscription" SET "tenantId" = "organizationId" WHERE "tenantId" IS NULL';
  END IF;
END $$;

UPDATE "Subscription"
SET "billingCycle" =
  CASE
    WHEN COALESCE("planType", '') = 'ANNUAL' THEN 'ANNUAL'::"BillingCycle"
    ELSE 'MONTHLY'::"BillingCycle"
  END
WHERE "billingCycle" IS NULL;

UPDATE "Subscription"
SET "nextBillingDate" = COALESCE("nextBillingDate", "endDate", CURRENT_TIMESTAMP)
WHERE "nextBillingDate" IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'Subscription' AND column_name = 'status'
      AND data_type IN ('text', 'character varying')
  ) THEN
    UPDATE "Subscription"
    SET "status" =
      CASE
        WHEN UPPER("status") = 'ACTIVE' THEN 'ACTIVE'
        WHEN UPPER("status") IN ('PAST_DUE', 'GRACE') THEN 'GRACE'
        WHEN UPPER("status") IN ('LOCKED', 'CANCELLED') THEN UPPER("status")
        ELSE 'CANCELLED'
      END;

    ALTER TABLE "Subscription" ALTER COLUMN "status" TYPE "SubscriptionStatus" USING "status"::"SubscriptionStatus";
  END IF;
END $$;

INSERT INTO "Plan" ("id", "name", "pricePerShopMonthly", "annualDiscountPercent", "features", "createdAt", "updatedAt")
VALUES
  ('plan_starter', 'Starter', 0, 0, ARRAY['core-dashboard'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('plan_growth', 'Growth', 99, 10, ARRAY['core-dashboard','messaging','gps-tracking','analytics'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('plan_enterprise', 'Enterprise', 199, 20, ARRAY['core-dashboard','messaging','gps-tracking','analytics','hr-suite','mobile-pos'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

UPDATE "Subscription"
SET "planId" = COALESCE("planId", 'plan_growth')
WHERE "planId" IS NULL;

ALTER TABLE "Subscription"
  ALTER COLUMN "tenantId" SET NOT NULL,
  ALTER COLUMN "planId" SET NOT NULL,
  ALTER COLUMN "billingCycle" SET NOT NULL,
  ALTER COLUMN "status" SET NOT NULL,
  ALTER COLUMN "nextBillingDate" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'Subscription' AND constraint_name = 'Subscription_tenantId_fkey'
  ) THEN
    ALTER TABLE "Subscription"
      ADD CONSTRAINT "Subscription_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'Subscription' AND constraint_name = 'Subscription_planId_fkey'
  ) THEN
    ALTER TABLE "Subscription"
      ADD CONSTRAINT "Subscription_planId_fkey"
      FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Subscription_tenantId_idx" ON "Subscription"("tenantId");
CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX IF NOT EXISTS "Subscription_nextBillingDate_idx" ON "Subscription"("nextBillingDate");
