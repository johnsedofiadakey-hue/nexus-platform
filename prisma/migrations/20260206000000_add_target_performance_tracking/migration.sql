-- AlterTable: Add performance tracking fields to Target table
ALTER TABLE "Target" ADD COLUMN IF NOT EXISTS "achievedQuantity" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Target" ADD COLUMN IF NOT EXISTS "achievedValue" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Target" ADD COLUMN IF NOT EXISTS "targetType" TEXT NOT NULL DEFAULT 'AGENT';

-- CreateIndex: Add indexes for performance
CREATE INDEX IF NOT EXISTS "Target_status_idx" ON "Target"("status");
CREATE INDEX IF NOT EXISTS "Target_targetType_idx" ON "Target"("targetType");

-- Update existing targets to have default values
UPDATE "Target" SET "targetType" = 'AGENT' WHERE "targetType" IS NULL OR "targetType" = '';
