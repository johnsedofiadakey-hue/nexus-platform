#!/bin/bash
set -e

# Nexus Platform - Complete Vercel Deployment Script
# This script configures and deploys both Admin and Agent portals to Vercel

echo "🚀 Nexus Platform Deployment Script"
echo "===================================="
echo ""

# Environment Variables
NEXTAUTH_SECRET="17hOqPIYhW7U08WAXcNQoo++MLxDypdJIKT1gg/qcLU="
DATABASE_URL="postgresql://postgres.lqkpyqcokdeaefmisgbs:Sedofia1010.@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

echo "⚠️  IMPORTANT SECURITY NOTICE:"
echo "   The database password 'Sedofia1010.' was exposed in git history."
echo "   You MUST change it in Supabase IMMEDIATELY after deployment."
echo ""
read -p "Press ENTER to continue with deployment..."
echo ""

# Check if logged in to Vercel
echo "📋 Checking Vercel authentication..."
if ! vercel whoami &>/dev/null; then
    echo "❌ Not logged in to Vercel. Please run: vercel login"
    exit 1
fi
echo "✅ Logged in to Vercel"
echo ""

# Link projects (if not already linked)
echo "🔗 Linking Vercel projects..."

# Admin Portal
echo "Configuring Admin Portal..."
cd apps/admin
if [ ! -d ".vercel" ]; then
    echo "  Linking admin portal project..."
    vercel link --yes || true
fi

# Set environment variables for Admin Portal
echo "  Setting environment variables for Admin Portal..."
vercel env rm DATABASE_URL production --yes 2>/dev/null || true
vercel env rm NEXTAUTH_SECRET production --yes 2>/dev/null || true
vercel env rm NEXTAUTH_URL production --yes 2>/dev/null || true

echo "$DATABASE_URL" | vercel env add DATABASE_URL production --yes
echo "$NEXTAUTH_SECRET" | vercel env add NEXTAUTH_SECRET production --yes

# Get admin URL from vercel
ADMIN_URL=$(vercel inspect --prod 2>/dev/null | grep -oP 'https://[^[:space:]]+' | head -1 || echo "https://admin-nexus-platform.vercel.app")
echo "$ADMIN_URL" | vercel env add NEXTAUTH_URL production --yes

echo "✅ Admin Portal environment variables set"
cd ../..

# Agent Portal
echo ""
echo "Configuring Agent Portal..."
cd apps/agent
if [ ! -d ".vercel" ]; then
    echo "  Linking agent portal project..."
    vercel link --yes || true
fi

# Set environment variables for Agent Portal
echo "  Setting environment variables for Agent Portal..."
vercel env rm DATABASE_URL production --yes 2>/dev/null || true
vercel env rm NEXTAUTH_SECRET production --yes 2>/dev/null || true
vercel env rm NEXTAUTH_URL production --yes 2>/dev/null || true

echo "$DATABASE_URL" | vercel env add DATABASE_URL production --yes
echo "$NEXTAUTH_SECRET" | vercel env add NEXTAUTH_SECRET production --yes

# Get agent URL from vercel
AGENT_URL=$(vercel inspect --prod 2>/dev/null | grep -oP 'https://[^[:space:]]+' | head -1 || echo "https://agent-nexus-platform.vercel.app")
echo "$AGENT_URL" | vercel env add NEXTAUTH_URL production --yes

echo "✅ Agent Portal environment variables set"
cd ../..

# Deploy both portals
echo ""
echo "🚀 Deploying to Vercel..."
echo ""

# Deploy Admin Portal
echo "Deploying Admin Portal..."
cd apps/admin
vercel --prod --yes
ADMIN_DEPLOYMENT_URL=$(vercel ls 2>/dev/null | grep "Ready" | head -1 | awk '{print $2}')
echo "✅ Admin Portal deployed: $ADMIN_DEPLOYMENT_URL"
cd ../..

echo ""

# Deploy Agent Portal  
echo "Deploying Agent Portal..."
cd apps/agent
vercel --prod --yes
AGENT_DEPLOYMENT_URL=$(vercel ls 2>/dev/null | grep "Ready" | head -1 | awk '{print $2}')
echo "✅ Agent Portal deployed: $AGENT_DEPLOYMENT_URL"
cd ../..

echo ""
echo "========================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "========================================="
echo ""
echo "📍 Deployment URLs:"
echo "   Admin Portal: $ADMIN_DEPLOYMENT_URL"
echo "   Agent Portal: $AGENT_DEPLOYMENT_URL"
echo ""
echo "⚠️  CRITICAL SECURITY TASKS:"
echo "   1. Go to Supabase dashboard"
echo "   2. Change database password from 'Sedofia1010.'"
echo "   3. Update DATABASE_URL in Vercel with new password:"
echo "      vercel env add DATABASE_URL production"
echo "   4. Redeploy both portals after password change"
echo ""
echo "✅ Next Steps:"
echo "   1. Test login on both portals"
echo "   2. Verify API endpoints work"
echo "   3. Check Vercel function logs for errors"
echo "   4. Monitor initial traffic"
echo ""
