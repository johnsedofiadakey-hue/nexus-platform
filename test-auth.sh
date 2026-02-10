#!/bin/bash

# Test script to verify authentication is working

echo "🧪 Testing Authentication Flow..."
echo ""

# Test 1: Check environment variables
echo "1️⃣ Checking environment variables..."
if [ -f "apps/admin/.env.local" ]; then
  echo "✅ apps/admin/.env.local exists"
else
  echo "❌ apps/admin/.env.local missing"
fi

if [ -f "apps/agent/.env.local" ]; then
  echo "✅ apps/agent/.env.local exists"
else
  echo "❌ apps/agent/.env.local missing"
fi

echo ""

# Test 2: Check if servers are running
echo "2️⃣ Checking if dev servers are running..."
if lsof -i :3001 > /dev/null 2>&1; then
  echo "✅ Admin server running on port 3001"
else
  echo "❌ Admin server NOT running on port 3001"
fi

if lsof -i :3002 > /dev/null 2>&1; then
  echo "✅ Agent server running on port 3002"
else
  echo "❌ Agent server NOT running on port 3002"
fi

echo ""

# Test 3: Test database connection
echo "3️⃣ Testing database connection..."
npx tsx -e "import { PrismaClient } from '@prisma/client'; const prisma = new PrismaClient(); prisma.user.count().then(count => console.log('✅ Database connected. Users:', count)).catch(e => console.error('❌ Database error:', e.message)).finally(() => prisma.\$disconnect())"

echo ""

# Test 4: Verify admin user exists
echo "4️⃣ Verifying admin user..."
npx tsx -e "import { PrismaClient } from '@prisma/client'; import { compare } from 'bcryptjs'; const prisma = new PrismaClient(); (async () => { const user = await prisma.user.findUnique({ where: { email: 'admin@nexus.com' } }); if (user) { const valid = await compare('admin123', user.password); console.log('✅ Admin user exists'); console.log('   Email:', user.email); console.log('   Role:', user.role); console.log('   Password valid:', valid); } else { console.log('❌ Admin user not found'); } })().finally(() => prisma.\$disconnect())"

echo ""
echo "✅ Test complete!"
