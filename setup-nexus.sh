#!/bin/bash

# 🚀 Quick Setup Script for Nexus Platform
# This will help you fix the "Intelligence Link Severed" error

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║   🛰️  NEXUS PLATFORM - QUICK SETUP WIZARD           ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Step 1: Check .env file
echo "📋 Step 1/3: Checking configuration files..."
if [ -f .env ]; then
    echo "   ✅ .env file exists"
else
    echo "   ⚠️  Creating .env file..."
    cp .env.example .env 2>/dev/null || touch .env
fi

# Step 2: Check if DATABASE_URL is configured
echo ""
echo "🔍 Step 2/3: Checking database connection..."

if grep -q "DATABASE_URL=" .env && ! grep -q "username:password\|your-" .env | head -1; then
    echo "   ✅ DATABASE_URL appears to be configured"
    echo "   🔄 Testing connection..."
    
    # Try to connect
    if npx prisma db execute --stdin <<< "SELECT 1;" 2>&1 | grep -q "Executed"; then
        echo "   ✅ Database connection successful!"
        DB_OK=true
    else
        echo "   ❌ Database connection failed"
        echo "   ⚠️  Please verify your DATABASE_URL is correct"
        DB_OK=false
    fi
else
    echo "   ❌ DATABASE_URL not configured"
    echo ""
    echo "   📝 You need to add a PostgreSQL database URL to your .env file"
    echo ""
    echo "   🎯 Quick Options:"
    echo ""
    echo "   A) Use Supabase (FREE, Recommended):"
    echo "      1. Visit: https://supabase.com"
    echo "      2. Create a new project"
    echo "      3. Go to Settings → Database"
    echo "      4. Copy 'Connection String' (Transaction mode)"
    echo "      5. Paste it in .env as DATABASE_URL="
    echo ""
    echo "   B) Use Neon (FREE):"
    echo "      1. Visit: https://neon.tech"
    echo "      2. Create new project"
    echo "      3. Copy connection string"
    echo "      4. Paste it in .env as DATABASE_URL="
    echo ""
    echo "   C) Use Local PostgreSQL:"
    echo "      DATABASE_URL=\"postgresql://postgres:password@localhost:5432/nexus\""
    echo ""
    echo "   After adding DATABASE_URL, run this script again!"
    echo ""
    exit 1
fi

# Step 3: Check NEXTAUTH_SECRET
echo ""
echo "🔐 Step 3/3: Checking authentication..."
if grep -q "NEXTAUTH_SECRET=" .env && ! grep -q "your-nextauth\|your-secret" .env; then
    echo "   ✅ NEXTAUTH_SECRET is configured"
else
    echo "   ⚠️  NEXTAUTH_SECRET not found, generating..."
    SECRET=$(openssl rand -base64 32)
    
    if grep -q "NEXTAUTH_SECRET=" .env; then
        # Update existing line
        sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$SECRET\"|" .env
    else
        # Add new line
        echo "NEXTAUTH_SECRET=\"$SECRET\"" >> .env
    fi
    echo "   ✅ NEXTAUTH_SECRET generated and saved"
fi

# Final steps
echo ""
echo "═══════════════════════════════════════════════════════"

if [ "$DB_OK" = true ]; then
    echo ""
    echo "✅ CONFIGURATION COMPLETE!"
    echo ""
    echo "🔄 Syncing database schema..."
    npx prisma generate
    npx prisma db push --skip-generate
    
    echo ""
    echo "🎉 ALL SET! Your Personnel Portal should now work."
    echo ""
    echo "📌 Next Steps:"
    echo "   1. Restart your dev server if running: npm run dev"
    echo "   2. Access admin panel and click on a team member"
    echo "   3. Personnel portal should load without errors"
    echo ""
else
    echo ""
    echo "⚠️  SETUP INCOMPLETE"
    echo ""
    echo "   Please configure DATABASE_URL in .env file"
    echo "   Then run this script again: ./setup-nexus.sh"
    echo ""
fi
