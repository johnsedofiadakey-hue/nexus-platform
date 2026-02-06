# Database Migration Required

## New Features Added

1. **Target History Tracking** - Track all changes to performance targets
2. **Master Activity Log** - System-wide activity tracking for all users
3. **Editable/Deletable Targets** - Full CRUD operations on targets
4. **Activity Pulse renamed** - "Global Activity Pulse" is now "Activity Pulse"

## Migration Steps

The database schema has been updated to include two new tables:
- `TargetHistory` - Tracks target changes and progress
- `ActivityLog` - Master activity log for all system events

### Option 1: Using Prisma Migrate (Recommended for Production)

```bash
# Navigate to project directory
cd /workspaces/nexus-platform

# Run the migration
npx prisma migrate deploy
```

### Option 2: Using Prisma DB Push (For Development)

```bash
# Make sure DATABASE_URL is set in your environment
export DATABASE_URL="your_database_connection_string_here"

# Optionally set DIRECT_URL (same as DATABASE_URL if not using connection pooling)
export DIRECT_URL="$DATABASE_URL"

# Push schema changes to database
npx prisma@6.19.2 db push
```

### Option 3: Manual SQL Execution

If the above methods don't work, you can manually execute the migration SQL:

```sql
-- Run this SQL against your PostgreSQL database
-- File: prisma/migrations/20260206000000_add_target_history_and_activity_log/migration.sql

CREATE TABLE "TargetHistory" (
    "id" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousValue" JSONB,
    "newValue" JSONB,
    "progress" DOUBLE PRECISION DEFAULT 0,
    "achievedValue" DOUBLE PRECISION DEFAULT 0,
    "achievedQuantity" INTEGER DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TargetHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TargetHistory_targetId_idx" ON "TargetHistory"("targetId");
CREATE INDEX "TargetHistory_userId_idx" ON "TargetHistory"("userId");
CREATE INDEX "TargetHistory_createdAt_idx" ON "TargetHistory"("createdAt");

CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "shopId" TEXT,
    "shopName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");
CREATE INDEX "ActivityLog_entity_idx" ON "ActivityLog"("entity");
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");
CREATE INDEX "ActivityLog_shopId_idx" ON "ActivityLog"("shopId");
```

## Verification

After running the migration, verify it was successful:

```bash
# Check if tables were created
npx prisma studio

# Or use psql
psql $DATABASE_URL -c "\dt"
```

Look for `TargetHistory` and `ActivityLog` in the list of tables.

## Regenerate Prisma Client

After migration, regenerate the Prisma Client:

```bash
npx prisma generate
```

## New Features Available After Migration

1. **Personnel Portal** - Targets are now editable and deletable with full history
2. **Master Activity Log** - Access from dashboard via "Activity Log" button
3. **Automated Activity Tracking** - All major actions are now logged automatically
4. **Target Progress History** - View how targets are being met over time

## API Endpoints Added

- `GET /api/activity-log` - Fetch activity logs with filtering
- `PATCH /api/targets` - Update existing targets
- `DELETE /api/targets?targetId=xxx` - Delete targets
- `GET /api/targets?includeHistory=true` - Get targets with history

## Notes

- The migration is backward compatible
- Existing data will not be affected
- New logging is non-blocking (failures won't break operations)
- Activity logs are automatically created for:
  - Target creation, updates, and deletions
  - Daily report submissions
  - (More actions can be added over time)
