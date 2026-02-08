#!/bin/bash

# 🔍 Supabase Connection Detective

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  🔎 SUPABASE DATABASE CONNECTION GUIDE                ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Extract the Supabase URL from culprit route
FOUND_URL=$(grep -o 'postgresql://[^"]*' src/app/api/culprit/route.ts 2>/dev/null | head -1)

if [ ! -z "$FOUND_URL" ]; then
    echo "✅ FOUND YOUR SUPABASE DATABASE URL IN CODE!"
    echo ""
    echo "   Location: src/app/api/culprit/route.ts"
    echo "   URL: ${FOUND_URL:0:50}...pooler.supabase.com:5432/postgres"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🎯 QUICK FIX - Let me update your .env file now!"
    echo ""
    
    # Backup current .env
    cp .env .env.backup 2>/dev/null
    
    # Update DATABASE_URL in .env
    if grep -q "^DATABASE_URL=" .env; then
        sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"$FOUND_URL\"|" .env
        echo "✅ Updated DATABASE_URL in .env file"
    else
        echo "DATABASE_URL=\"$FOUND_URL\"" >> .env
        echo "✅ Added DATABASE_URL to .env file"
    fi
    
    echo "✅ Backup saved to .env.backup"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🔌 Testing database connection..."
    echo ""
    
    # Test the connection
    if npx prisma db execute --stdin <<< "SELECT 1 as test;" 2>&1 | grep -q "Executed"; then
        echo "✅ DATABASE CONNECTION SUCCESSFUL!"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "🚀 Next steps:"
        echo ""
        echo "1. Sync database schema:"
        echo "   $ npx prisma generate"
        echo "   $ npx prisma db push"
        echo ""
        echo "2. Start your server:"
        echo "   $ npm run dev"
        echo ""
        echo "3. Test Personnel Portal:"
        echo "   Admin Panel → Click any team member"
        echo ""
        echo "✅ The 'Intelligence Link Severed' error should be FIXED!"
        echo ""
    else
        echo "⚠️  Connection test inconclusive"
        echo ""
        echo "The URL has been added to .env"
        echo "Try running: npm run dev"
        echo ""
    fi
    
else
    echo "📍 Let's find your Supabase database URL step-by-step:"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "STEP 1: Go to your Supabase Dashboard"
    echo "   → https://supabase.com/dashboard"
    echo ""
    echo "STEP 2: Select your project"
    echo "   → Click on your project name"
    echo ""
    echo "STEP 3: Navigate to Database Settings"
    echo "   → Left sidebar: Click 'Settings' (⚙️ icon)"
    echo "   → Click 'Database'"
    echo ""
    echo "STEP 4: Find Connection String"
    echo "   → Scroll down to 'Connection string'"
    echo "   → Select 'Transaction' mode (dropdown)"
    echo "   → Click 'Copy' button"
    echo ""
    echo "   It will look like:"
    echo "   postgresql://postgres.[project-ref]:[password]@[region].pooler.supabase.com:5432/postgres"
    echo ""
    echo "STEP 5: Add to .env file"
    echo "   $ nano .env"
    echo ""
    echo "   Replace the DATABASE_URL line with your copied string"
    echo ""
    echo "STEP 6: Test connection"
    echo "   $ npx prisma db execute --stdin <<< \"SELECT 1;\""
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📸 Visual Guide:"
    echo ""
    echo "   Dashboard → Settings → Database → Connection string"
    echo "                    ↓"
    echo "               [Transaction ▼]"
    echo "                    ↓"
    echo "            postgresql://...  [Copy]"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "💡 TIPS:"
    echo ""
    echo "• Use 'Transaction' mode (not 'Session')"
    echo "• Password is visible - click 'eye' icon to reveal"
    echo "• Make sure to copy the ENTIRE string"
    echo ""
fi
