# Fix Auth and Messages PR - Implementation Guide

## Overview
This PR implements safe, testable changes to fix authentication and messaging in nexus-platform, addressing deprecation warnings and improving CI safety.

## ✅ Changes Implemented

### 1. Fixed Prisma Model Usage (chatMessage → message)
- ✅ Updated `scripts/e2e/messages-test.js` to use `prisma.message`
- ✅ Updated `scripts/e2e/messages-test.ts` to use `prisma.message`
- ✅ Updated `scripts/e2e/insert-message.js` to use `prisma.message`
- ✅ Added proper error handling with descriptive logging
- ✅ All scripts now properly disconnect from Prisma on exit

### 2. Unified NextAuth to bcrypt (Single Source of Truth)
- ✅ Centralized auth configuration in `src/lib/auth.ts`
- ✅ Updated `src/app/api/auth/[...nextauth]/route.ts` to import and use `authOptions`
- ✅ Removed plain-text password comparisons
- ✅ Added guard to throw helpful error if `NEXTAUTH_SECRET` is missing
- ✅ All authentication now uses bcrypt.compare for security

### 3. Normalized Seed & Admin Scripts
- ✅ Updated `prisma/seed.ts` - Admin created with role `ADMIN`, hashed password
- ✅ Updated `verify-admin.ts` - Uses `admin@nexus.com` and bcrypt
- ✅ Updated `fix-auth.js` - Uses `admin@nexus.com` and bcrypt
- ✅ Updated `reset-admin.ts` - Uses `admin@nexus.com` and bcrypt
- ✅ All scripts are now idempotent (safe to run multiple times)
- ✅ Scripts print "DEV ONLY" credentials to console

**Standard Admin Credentials (DEV ONLY):**
- Email: `admin@nexus.com`
- Password: `admin123`

### 4. Fixed Middleware Auth Bypass
- ✅ Replaced `authorized: () => true` with proper token check
- ✅ Added optional dev bypass via `NEXT_PUBLIC_DEV_BYPASS=true`
- ✅ Added clear comments explaining authorization logic
- ✅ Production-safe by default (requires valid token)

### 5. Added Prisma Config File
- ✅ Created `prisma/prisma.config.ts` pointing to schema
- ✅ Keeps package.json cleaner with separated concerns

### 6. Package.json Updates
- ✅ Added `"prisma:generate": "prisma generate"` script
- ✅ Added `"seed": "tsx prisma/seed.ts"` script

### 7. GitHub Actions Workflows
- ✅ Created `.github/workflows/ci.yml` - Runs on PRs and pushes
  - Installs dependencies with `npm ci`
  - Generates Prisma client
  - Runs build
  - Runs lint (with continue-on-error)
  
- ✅ Created `.github/workflows/prisma-migrate.yml`
  - Auto-runs on push to main
  - Manual dispatch option to run seed
  - Uses secrets: `DATABASE_URL` and `DIRECT_URL`

### 8. Mobile Messaging Fixes
- ✅ Added POST handler to `src/app/api/mobile/messages/route.ts`
- ✅ If `receiverId` not provided, defaults to admin user
- ✅ Proper error handling and consistent response shapes
- ✅ Optimistic UI maintained in mobile page

---

## 🧪 Smoke Test Checklist

After merging this PR, perform the following tests:

### Setup Environment Variables
Add these to Vercel/Railway/etc:

```bash
DATABASE_URL=your_postgres_connection_string
DIRECT_URL=your_direct_connection_string
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
NEXTAUTH_URL=https://your-deployment-url.com

# Optional - only enable in development
NEXT_PUBLIC_DEV_BYPASS=false
```

### Setup GitHub Secrets
Add these secrets in GitHub Settings → Secrets and variables → Actions:
- `DATABASE_URL` - Your production database URL
- `DIRECT_URL` - Your direct database connection URL

### Database Setup
```bash
# 1. Run migrations
npx prisma migrate deploy

# 2. Generate Prisma client
npx prisma generate

# 3. Seed database (creates admin user)
npm run seed
```

### Test Authentication
1. ✅ Navigate to login page
2. ✅ Login with `admin@nexus.com` / `admin123`
3. ✅ Verify redirect to dashboard
4. ✅ Check that middleware allows access to `/dashboard/*` and `/mobilepos/*`
5. ✅ Logout and verify redirect back to login

### Test Messaging
1. ✅ Login as admin
2. ✅ Navigate to mobile messages: `/mobilepos/messages`
3. ✅ Send a test message
4. ✅ Verify message appears in list
5. ✅ Check database to confirm message was created with correct `senderId` and `receiverId`

### Test Scripts
```bash
# Test admin creation/update
node fix-auth.js

# Test E2E messaging
npm run e2e:messages

# Verify admin exists
tsx verify-admin.ts
```

### Test CI/CD
1. ✅ Create a test PR and verify CI workflow runs
2. ✅ Check that build completes successfully
3. ✅ Merge to main and verify prisma-migrate workflow runs

---

## 🔐 Security Notes

1. **Password Hashing**: All passwords are now hashed with bcrypt (10 rounds)
2. **Auth Middleware**: Production requires valid JWT token (dev bypass disabled by default)
3. **Secret Validation**: Application will fail to start if `NEXTAUTH_SECRET` is not set
4. **Session Duration**: JWT sessions last 30 days

---

## 🚀 Deployment Instructions

### First-Time Deployment
1. Set all required environment variables
2. Deploy code to Vercel/Railway
3. Run migrations: `npx prisma migrate deploy`
4. Run seed: `npm run seed`
5. Test login with admin credentials

### Subsequent Deployments
1. Deploy code changes
2. Migrations run automatically via GitHub Actions (on push to main)
3. Or manually trigger migration workflow in GitHub Actions tab

### Manual Migration (if needed)
```bash
# Connect to production environment
export DATABASE_URL="your_production_url"
export DIRECT_URL="your_direct_url"

# Run migration
npx prisma migrate deploy

# Optionally seed/reset admin
npm run seed
```

---

## 📝 Breaking Changes

⚠️ **IMPORTANT**: All existing user passwords must be hashed!

If you have existing users with plain-text passwords, run this migration:

```javascript
// migrate-passwords.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function migratePasswords() {
  const prisma = new PrismaClient();
  
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    // Skip if already hashed (bcrypt hashes start with $2)
    if (user.password.startsWith('$2')) continue;
    
    const hashed = await bcrypt.hash(user.password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed }
    });
    console.log(`Migrated password for ${user.email}`);
  }
  
  await prisma.$disconnect();
}

migratePasswords();
```

---

## 🛠️ Troubleshooting

### "NEXTAUTH_SECRET is not set"
- Add `NEXTAUTH_SECRET` to your environment variables
- Generate one with: `openssl rand -base64 32`

### "Prisma Client not generated"
- Run: `npx prisma generate`
- Should happen automatically via `postinstall` script

### CI Build Fails
- Check that dummy env vars are set in workflow
- Verify Node version is 20.x
- Check for syntax errors in code

### Migration Fails
- Ensure `DATABASE_URL` and `DIRECT_URL` secrets are set in GitHub
- Check database connectivity
- Review migration logs in Actions tab

### Login Fails
- Verify user exists in database with hashed password
- Check that password starts with `$2` (bcrypt hash)
- Run `npm run seed` to reset admin user
- Check browser console for auth errors

### Messages Not Sending
- Verify both users exist in database
- Check browser network tab for API errors
- Verify receiverId is valid user ID
- Check server logs for Prisma errors

---

## 📚 Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [bcrypt.js Documentation](https://github.com/dcodeIO/bcrypt.js)

---

## ✨ Credits

Implemented as part of authentication and messaging fixes for nexus-platform.
All changes maintain backward compatibility where possible and prioritize security.
