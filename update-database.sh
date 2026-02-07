#!/bin/bash
# Quick Database Update Script

echo "🔧 NEXUS DATABASE UPDATE"
echo "========================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found!"
    echo ""
    echo "Please create .env file with your DATABASE_URL:"
    echo ""
    echo "1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables"
    echo "2. Copy your DATABASE_URL"
    echo "3. Create .env file here:"
    echo ""
    echo "cat > .env << 'EOF'"
    echo "DATABASE_URL=\"paste-your-url-here\""
    echo "EOF"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo "✅ .env file found"
echo ""

# Check if DATABASE_URL is set
if grep -q "DATABASE_URL=" .env; then
    echo "✅ DATABASE_URL found in .env"
else
    echo "❌ DATABASE_URL not found in .env"
    exit 1
fi

echo ""
echo "📦 Generating Prisma Client..."
npx prisma generate

echo ""
echo "🗄️ Updating database schema..."
echo "This will add:"
echo "  - Foreign key constraints (faster queries)"
echo "  - Performance indexes"
echo "  - Remove relationMode"
echo ""

npx prisma db push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ DATABASE UPDATED SUCCESSFULLY!"
    echo ""
    echo "🚀 Next: Go to Vercel Dashboard and trigger a redeploy"
    echo "Your app should work perfectly after that!"
else
    echo ""
    echo "❌ Database update failed. Check the error above."
    echo "Make sure your DATABASE_URL is correct and accessible."
fi
