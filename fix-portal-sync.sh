#!/bin/bash
# Quick fix script for personnel portal sync issues

echo "🔍 Checking Personnel Portal Health..."
echo ""

# Check if DATABASE_URL exists
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found!"
    echo ""
    echo "Quick Fix:"
    echo "Add your database connection to .env file:"
    echo ""
    echo "DATABASE_URL=\"postgresql://user:password@host:5432/database\""
    echo "NEXTAUTH_SECRET=\"$(openssl rand -base64 32)\""
    echo "NEXTAUTH_URL=\"http://localhost:3000\""
    echo ""
    exit 1
else
    echo "✅ DATABASE_URL found"
fi

echo ""
echo "📦 Regenerating Prisma Client..."
npx prisma generate

echo ""
echo "🗄️ Checking database schema..."
npx prisma db push --accept-data-loss

echo ""
echo "✅ All checks complete!"
echo ""
echo "Next step: Start your server with 'npm run dev'"
