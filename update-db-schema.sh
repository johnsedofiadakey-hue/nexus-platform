#!/bin/bash
# Run this script on Vercel to update database schema

echo "🗄️ Updating Nexus Database Schema..."
echo ""
echo "This will:"
echo "  ✅ Remove relationMode (faster queries)"
echo "  ✅ Add foreign key constraints" 
echo "  ✅ Add performance indexes"
echo ""

# Check if DATABASE_URL exists
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL not set!"
    echo "Add it in Vercel Environment Variables"
    exit 1
fi

echo "📦 Generating Prisma Client..."
npx prisma generate

echo ""
echo "🔄 Applying schema changes to database..."
npx prisma db push --accept-data-loss --skip-generate

echo ""
echo "✅ Database schema updated successfully!"
echo ""
echo "Next: Restart your Vercel deployment or wait for the next request."
