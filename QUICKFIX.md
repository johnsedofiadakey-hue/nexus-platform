# 🛰️ PERSONNEL PORTAL FIX - QUICK START

## ❌ Problem
When accessing the personnel portal from admin panel, you see:
```
Intelligence Link Severed
Failed to sync records
```

## ✅ Root Cause
**Database connection not configured** - The app needs a PostgreSQL database URL to work.

---

## 🚀 QUICK FIX (Choose One Method)

### Method 1: Automated Setup (Easiest)
```bash
./setup-nexus.sh
```
This script will:
- Check your configuration
- Guide you to set up a database if needed
- Generate authentication secrets
- Sync your database schema
- Tell you exactly what's missing

### Method 2: Manual Setup
Edit `.env` file and add:

```env
# Get from Supabase/Neon/Railway (see options below)
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Already generated for you!
NEXTAUTH_SECRET="SJkGuwDQCjUf0yYmGEIq+1as58oSJ7M9kjjdeUdpbUk="

# For local development
NEXTAUTH_URL="http://localhost:3000"
```

Then run:
```bash
npx prisma generate
npx prisma db push
npm run dev
```

---

## 🗄️ Where to Get a Database (Pick One)

### Option A: Supabase (Recommended - FREE)
1. **Sign up:** https://supabase.com
2. **Create project** → Wait 2-3 minutes for setup
3. **Settings → Database → Connection String**
4. **Select "Transaction" mode** (important!)
5. **Copy the full string** and paste in `.env` as `DATABASE_URL`

Example:
```
DATABASE_URL="postgresql://postgres.xyz:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

### Option B: Neon (FREE)
1. **Sign up:** https://neon.tech
2. **Create project**
3. **Copy connection string** from dashboard
4. **Paste in `.env`**

### Option C: Railway (FREE tier available)
1. **Sign up:** https://railway.app
2. **New Project → Add PostgreSQL**
3. **Variables tab → Copy `DATABASE_URL`**
4. **Paste in `.env`**

### Option D: Local PostgreSQL
If you have PostgreSQL installed locally:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/nexus_platform"
```

---

## ✅ Verify It Works

1. **Check database connection:**
   ```bash
   npx prisma db execute --stdin <<< "SELECT 1;"
   ```
   Should show "Executed successfully" ✅

2. **Start the server:**
   ```bash
   npm run dev
   ```

3. **Access admin panel** → Click on any team member

4. **Personnel portal should load** without errors! 🎉

---

## 📋 What Was Fixed

### Files Created:
- ✅ `.env` - Environment configuration with pre-generated secrets
- ✅ `setup-nexus.sh` - Automated setup wizard
- ✅ `fix-personnel-portal.sh` - Diagnostic tool
- ✅ `PERSONNEL_PORTAL_FIX.md` - Detailed troubleshooting guide

### Code Improvements:
- ✅ Enhanced error messages in API ([src/app/api/hr/member/[id]/route.ts](src/app/api/hr/member/[id]/route.ts))
- ✅ Better error display in UI ([src/app/dashboard/hr/member/[id]/page.tsx](src/app/dashboard/hr/member/[id]/page.tsx))
- ✅ Specific database connection error detection
- ✅ Helpful hints when errors occur

### Error Messages Now Show:
- ❌ "Database connection failed" → Check DATABASE_URL
- ❌ "Database not configured" → Run setup script
- ❌ "Schema out of sync" → Run prisma db push
- ❌ Specific error codes and hints for each issue

---

## 🆘 Still Having Issues?

### Check the logs:
Look at your terminal where `npm run dev` is running for detailed error messages.

### Common Errors:

| Error | Fix |
|-------|-----|
| `Environment variable not found: DATABASE_URL` | Add DATABASE_URL to `.env` |
| `Can't reach database server` | Check DATABASE_URL is correct |
| `Connection refused` | Database server is offline or URL is wrong |
| `P2021` or schema errors | Run `npx prisma db push` |

### Debug with diagnostic script:
```bash
./fix-personnel-portal.sh
```

### Get more help:
See [PERSONNEL_PORTAL_FIX.md](./PERSONNEL_PORTAL_FIX.md) for complete troubleshooting guide.

---

## 🎯 Next Steps After Setup

Once database is configured:

1. **Create admin user** (if needed):
   ```bash
   npx ts-node scripts/create-admin.ts
   ```

2. **Seed demo data** (optional):
   ```bash
   npx prisma db seed
   ```

3. **Deploy to production:**
   See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## 📞 Quick Reference

| Command | Purpose |
|---------|---------|
| `./setup-nexus.sh` | Automated setup wizard |
| `./fix-personnel-portal.sh` | Diagnose connection issues |
| `npm run dev` | Start development server |
| `npx prisma db push` | Sync database schema |
| `npx prisma studio` | View database in browser |

---

**✨ Your NEXTAUTH_SECRET is already generated and saved in .env**

**📝 Just add DATABASE_URL and you're ready to go!**
