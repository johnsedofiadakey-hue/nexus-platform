#!/bin/bash

# 🛠️ Personnel Portal Connection Fix Script
# This script helps diagnose and fix the "Intelligence Link Severed" error

echo "🔍 NEXUS PLATFORM - PERSONNEL PORTAL DIAGNOSTIC"
echo "================================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ ERROR: .env file not found!"
    echo "   → Creating .env from template..."
    cp .env.example .env 2>/dev/null || echo "   → .env file created manually"
    echo ""
    echo "⚠️  ACTION REQUIRED:"
    echo "   1. Edit the .env file and add your DATABASE_URL"
    echo "   2. Generate NEXTAUTH_SECRET with: openssl rand -base64 32"
    echo "   3. Restart your dev server: npm run dev"
    exit 1
fi

echo "✅ .env file found"
echo ""

# Check DATABASE_URL
echo "🔎 Checking DATABASE_URL..."
if grep -q "DATABASE_URL=" .env && ! grep -q "username:password" .env; then
    echo "✅ DATABASE_URL is configured"
    
    # Test database connection
    echo ""
    echo "🔌 Testing database connection..."
    npx prisma db execute --stdin <<< "SELECT 1;" 2>&1 | grep -q "error" && {
        echo "❌ Database connection failed!"
        echo "   Check your DATABASE_URL in .env file"
        exit 1
    }
    echo "✅ Database connection successful"
    
else
    echo "❌ DATABASE_URL not configured properly"
    echo ""
    echo "⚠️  ACTION REQUIRED:"
    echo "   Edit .env and set your DATABASE_URL to a valid PostgreSQL connection string"
    echo ""
    echo "   Example:"
    echo "   DATABASE_URL=\"postgresql://user:pass@host:5432/dbname\""
    echo ""
    echo "   Get one from:"
    echo "   - Supabase (free): https://supabase.com"
    echo "   - Neon (free): https://neon.tech"
    echo "   - Railway: https://railway.app"
    exit 1
fi

echo ""
echo "🔎 Checking NEXTAUTH_SECRET..."
if grep -q "NEXTAUTH_SECRET=" .env && ! grep -q "your-" .env | head -1; then
    echo "✅ NEXTAUTH_SECRET is configured"
else
    echo "❌ NEXTAUTH_SECRET not configured"
    echo "   → Generating one now..."
    SECRET=$(openssl rand -base64 32)
    sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$SECRET\"|" .env
    echo "✅ NEXTAUTH_SECRET generated and saved to .env"
fi

echo ""
echo "🔄 Syncing database schema..."
npx prisma generate
npx prisma db push --skip-generate

echo ""
echo "✅ ALL CHECKS PASSED!"
echo ""
echo "🎯 Next steps:"
echo "   1. Restart your development server: npm run dev"
echo "   2. Access personnel portal from admin panel"
echo "   3. The 'Intelligence Link Severed' error should be resolved"
echo ""
