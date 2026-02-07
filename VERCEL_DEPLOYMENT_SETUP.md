# 🚀 Vercel Deployment Setup Guide

**Your Deployment URL:** https://nexus-platform-john-dakeys-projects.vercel.app

## ⚠️ Fix "Verification" or Authentication Issues

Your app is deployed but requires environment variables to work properly. Follow these steps:

---

## 📋 Step 1: Set Environment Variables on Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project: **nexus-platform**
3. Go to **Settings** → **Environment Variables**

### Required Variables:

#### 1. DATABASE_URL (PostgreSQL Connection)
```
DATABASE_URL=postgresql://username:password@host:5432/database?schema=public
```

**Where to get this:**
- **Supabase**: Project Settings → Database → Connection String → URI
- **Neon**: Connection Details → Connection String
- **Railway**: Database → Connect → Postgres Connection URL
- **Vercel Postgres**: Storage → Your Database → Connection String

#### 2. NEXTAUTH_SECRET (Authentication Secret)
```
NEXTAUTH_SECRET=your-generated-secret-here
```

**Generate it:**
```bash
openssl rand -base64 32
```
Or use: https://generate-secret.vercel.app/32

#### 3. NEXTAUTH_URL (Your Deployed App URL)
```
NEXTAUTH_URL=https://nexus-platform-john-dakeys-projects.vercel.app
```

### Optional Variables (if using Supabase):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📋 Step 2: Complete Environment Variable Setup on Vercel

### Using Vercel Dashboard:

1. **Navigate to Environment Variables:**
   - Vercel Dashboard → Your Project → Settings → Environment Variables

2. **Add each variable:**
   - Click **"Add New"**
   - Enter **Key**: `DATABASE_URL`
   - Enter **Value**: Your PostgreSQL connection string
   - Select environments: **Production**, **Preview**, **Development** (check all 3)
   - Click **"Save"**

3. **Repeat for all required variables:**
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`

### Using Vercel CLI (Alternative):

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login
vercel login

# Add environment variables
vercel env add DATABASE_URL production
# Paste your database URL when prompted

vercel env add NEXTAUTH_SECRET production
# Paste your secret when prompted

vercel env add NEXTAUTH_URL production
# Enter: https://nexus-platform-john-dakeys-projects.vercel.app
```

---

## 📋 Step 3: Deploy Database Schema

Your database needs the Prisma schema. Run this once:

```bash
# From your local machine or Codespace
npx prisma db push
```

Or trigger it automatically on Vercel by redeploying:
```bash
vercel --prod
```

---

## 📋 Step 4: Redeploy on Vercel

After adding environment variables:

### Option A: Via Dashboard
1. Go to **Deployments** tab
2. Click the **"Redeploy"** button on the latest deployment
3. Check **"Use existing Build Cache"** = OFF (to force fresh build with new env vars)

### Option B: Via CLI
```bash
vercel --prod
```

### Option C: Trigger from GitHub
```bash
# Make a small change and push
git commit --allow-empty -m "chore: trigger redeploy"
git push origin main
```

---

## 🔍 Step 5: Verify Deployment

1. Wait for deployment to complete (2-3 minutes)
2. Visit: https://nexus-platform-john-dakeys-projects.vercel.app
3. Try to sign in - it should work now!

---

## 🎯 Quick Test Checklist

✅ Environment variables set on Vercel  
✅ NEXTAUTH_URL matches your Vercel deployment URL  
✅ DATABASE_URL is a valid PostgreSQL connection  
✅ NEXTAUTH_SECRET is set (at least 32 characters)  
✅ Database schema deployed (prisma db push)  
✅ Redeployed after adding environment variables  

---

## 🐛 Troubleshooting

### Issue: "Internal Server Error" or Blank Page
**Fix:** Check Vercel logs:
1. Go to **Deployments** → Click latest deployment
2. Click **"View Function Logs"**
3. Look for errors related to:
   - `DATABASE_URL` connection failed
   - `NEXTAUTH_SECRET` missing
   - Prisma Client not generated

### Issue: "Error: Database schema is not in sync"
**Fix:** Run database migration:
```bash
npx prisma db push
```

### Issue: Login redirects loop
**Fix:** Make sure `NEXTAUTH_URL` exactly matches your deployment URL (including https://)

### Issue: Database connection refused
**Fix:** 
1. Verify `DATABASE_URL` is correct
2. Make sure database allows connections from Vercel IPs
3. For Supabase: Use "Connection Pooling" URL for serverless

---

## 📱 Share with Client

Once everything works, share this link:
```
https://nexus-platform-john-dakeys-projects.vercel.app
```

### Create Admin Account

First user to register will become admin. Or use the script:
```bash
# Create admin via Prisma Studio
npx prisma studio
# Or use the create-admin script (if available)
```

---

## 🔐 Security Checklist Before Sharing

- [ ] Changed default admin password
- [ ] Environment variables are set and secure
- [ ] Database has proper access controls
- [ ] NEXTAUTH_SECRET is strong and unique
- [ ] No sensitive data in public repositories

---

**Need Help?**
- Check Vercel deployment logs for detailed errors
- Review database connection status
- Verify all environment variables are properly set

**Deployment Status:** ✅ Code Deployed | ⏳ Awaiting Environment Configuration
