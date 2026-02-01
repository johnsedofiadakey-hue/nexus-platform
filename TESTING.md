# Testing Guide for Authentication and Messaging Fixes

This document provides step-by-step instructions for testing the authentication and messaging fixes implemented in this PR.

## Prerequisites

Before testing, ensure you have:
- Node.js (v18 or later) installed
- PostgreSQL database instance running
- Access to the repository on your local machine

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the project root (or copy from `.env.example`):

```bash
cp .env.example .env
```

Edit the `.env` file with your actual values:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/nexus_db?schema=public"
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"
NODE_ENV="development"
```

To generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

Generate Prisma client:
```bash
npx prisma generate
```

Run migrations (choose one):
```bash
# For development
npx prisma migrate dev --name init

# OR for production/deployed
npx prisma migrate deploy
```

### 4. Seed Database

```bash
npm run seed
```

Expected output:
```
🌱 STARTING SYSTEM RESET...
✅ Database cleared.
👤 Created Agent: ernest@nexus.com | Password: 123 (hashed in DB)
🏢 Created Shop: Nexus HQ
👑 Admin User: admin@nexus.com | Password: admin123 (hashed in DB)
```

## Test Cases

### Test 1: Authentication with BCrypt

**Objective**: Verify that login works with bcrypt-hashed passwords.

**Steps**:
1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/auth/login`

3. Login with admin credentials:
   - Email: `admin@nexus.com`
   - Password: `admin123`

**Expected Result**: 
- ✅ Login succeeds
- ✅ Redirected to dashboard
- ✅ No console errors about password comparison

**Failure Indicators**:
- ❌ "Invalid password" error
- ❌ Stuck on login page
- ❌ Console errors about bcrypt

---

### Test 2: Middleware Authentication

**Objective**: Verify that middleware properly protects routes.

**Steps**:
1. Open browser in incognito/private mode
2. Navigate directly to `http://localhost:3000/dashboard`

**Expected Result**:
- ✅ Redirected to `/auth/login`
- ✅ Console shows middleware log: `[Middleware] Visiting: /dashboard | Role: Guest`

**With Valid Session**:
1. Login as admin
2. Navigate to `http://localhost:3000/dashboard`

**Expected Result**:
- ✅ Access granted
- ✅ Console shows: `[Middleware] Visiting: /dashboard | Role: ADMIN`

---

### Test 3: Message Model Usage

**Objective**: Verify that e2e scripts use the correct Prisma model.

**Steps**:
1. Ensure database is seeded (admin and john@nexus.com users exist)
2. Run the insert message script:
   ```bash
   node scripts/e2e/insert-message.js
   ```

**Expected Result**:
- ✅ Output: `Inserted message id: <some-cuid>`
- ✅ No errors about `prisma.chatMessage`

**Alternative Test** (TypeScript version):
```bash
npm run e2e:messages
```

**Expected Result**:
- ✅ Shows conversation rows with timestamps
- ✅ No TypeScript or Prisma errors

---

### Test 4: Message API Endpoints

**Objective**: Verify that message API routes work with authentication.

**Steps**:
1. Login to the application
2. Open browser DevTools > Network tab
3. Navigate to `http://localhost:3000/api/mobile/messages`

**Expected Result**:
- ✅ Status: 200 OK
- ✅ Returns JSON array of messages
- ✅ Each message has: `id`, `content`, `senderId`, `receiverId`, `createdAt`, `direction`

**Test POST endpoint**:
```bash
# Get session cookie first by logging in via browser
# Then use curl or Postman:
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<your-session-token>" \
  -d '{"content": "Test message", "receiverId": "<user-id>"}'
```

**Expected Result**:
- ✅ Status: 200 OK
- ✅ Returns created message object

---

### Test 5: Admin Scripts

**Objective**: Verify that admin utility scripts work correctly.

**Test verify-admin.ts**:
```bash
node verify-admin.ts
```

**Expected Result**:
```
⏳ Verifying admin account...
✅ ADMIN ACCOUNT VERIFIED
User ID: <cuid>
📧 Email: admin@nexus.com
🔑 Password: admin123 (for dev/testing only)
Hashed Password in DB: $2a$10$...
```

**Test fix-auth.js**:
```bash
node fix-auth.js
```

**Expected Result**:
```
⏳ Fixing auth for admin account...
--------------------------------------
✅ SUCCESS: Admin Account Fixed
📧 Email: admin@nexus.com
🔑 Password: admin123 (for dev/testing only)
🛡️ Role: ADMIN
--------------------------------------
```

**Test reset-admin.ts**:
```bash
npx tsx reset-admin.ts
```

**Expected Result**:
```
🚀 Resetting admin account...
---
✅ SUCCESS! Admin record created/updated.
📧 User: admin@nexus.com
🔑 Pass: admin123 (for dev/testing only)
---
```

---

## Troubleshooting

### Issue: "NEXTAUTH_SECRET is not defined"

**Solution**: Add `NEXTAUTH_SECRET` to your `.env` file:
```bash
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env
```

### Issue: "Invalid password" on login

**Possible Causes**:
1. Database still has plain-text passwords from before
2. Wrong admin email (should be `admin@nexus.com`, not `admin@stormglide.com`)

**Solution**: Re-run the seed:
```bash
npm run seed
```

### Issue: Middleware redirects to login even when authenticated

**Possible Causes**:
1. Session cookie not being set
2. NEXTAUTH_SECRET mismatch

**Temporary Workaround** (development only):
```bash
# Add to .env
SERVER_DEV_BYPASS=true
```

⚠️ **Warning**: Remove this before committing or deploying to production!

### Issue: "prisma.chatMessage is not a function"

**Solution**: This PR fixes this. Make sure you've pulled the latest changes:
```bash
git pull origin <branch-name>
```

### Issue: Database connection errors

**Check**:
1. PostgreSQL is running
2. `DATABASE_URL` in `.env` is correct
3. Database exists and is accessible

**Test connection**:
```bash
npx prisma db pull
```

---

## Security Checklist

Before deploying to production:

- [ ] `NEXTAUTH_SECRET` is set to a strong, random value
- [ ] `DATABASE_URL` does not contain plain-text passwords in commit history
- [ ] Admin password changed from `admin123` to a strong password
- [ ] `SERVER_DEV_BYPASS` is NOT set (or set to `false`)
- [ ] `.env` file is in `.gitignore`
- [ ] All test users removed from production database

---

## Reporting Issues

If you encounter any issues during testing:

1. Check the console for error messages
2. Check the server logs (terminal running `npm run dev`)
3. Verify your `.env` file has all required variables
4. Try clearing browser cookies/cache
5. Try restarting the development server

For persistent issues, please:
- Include console error messages
- Include relevant environment (Node version, OS, database)
- Describe exact steps to reproduce
