# 🔧 Vercel Environment Variables

To fix the refresh loop and make your app work on Vercel, you MUST set these environment variables:

## Required Environment Variables

Copy and paste these in Vercel Dashboard → Settings → Environment Variables:

### 1. NEXTAUTH_SECRET
Generate a secure secret:
```bash
openssl rand -base64 32
```
Or use: https://generate-secret.vercel.app/32

Example value:
```
NEXTAUTH_SECRET=your-generated-secret-here-32-chars-minimum
```

### 2. NEXTAUTH_URL
Your exact Vercel deployment URL:
```
NEXTAUTH_URL=https://nexus-platform-john-dakeys-projects.vercel.app
```

### 3. DATABASE_URL
Your PostgreSQL connection string:
```
DATABASE_URL=postgresql://username:password@host:5432/database?schema=public
```

**Where to get DATABASE_URL:**
- **Supabase**: Project Settings → Database → Connection String → URI (use Transaction mode)
- **Neon**: Dashboard → Connection Details → Connection String
- **Railway**: Database → Connect → Postgres Connection URL
- **Vercel Postgres**: Storage → Database → .env.local tab

---

## Quick Setup Steps

1. **Go to Vercel Dashboard**
   - https://vercel.com/dashboard
   - Select your project: `nexus-platform`

2. `**Settings → Environment Variables**

3. **Add each variable** (click "Add New" for each):
   - Key: `NEXTAUTH_SECRET`, Value: [generated secret]
   - Key: `NEXTAUTH_URL`, Value: `https://nexus-platform-john-dakeys-projects.vercel.app`
   - Key: `DATABASE_URL`, Value: [your database connection string]

4. **Select ALL environments** for each variable:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

5. **Click "Save"** for each variable

6. **Redeploy**:
   - Go to Deployments tab
   - Click "Redeploy" on the latest deployment
   - ✅ Uncheck "Use existing Build Cache"

---

## After Setting Variables

Your app will:
- ✅ Stop the refresh loop
- ✅ Show the login page correctly
- ✅ Allow users to sign in
- ✅ Work properly at: https://nexus-platform-john-dakeys-projects.vercel.app

---

## Verify It's Working

1. Visit: https://nexus-platform-john-dakeys-projects.vercel.app
2. Should see the login page (not a refresh loop)
3. Login should work
4. Should redirect to dashboard/mobilepos

---

## Still Having Issues?

Check Vercel deployment logs:
1. Deployments tab → Latest deployment
2. Click "View Function Logs"
3. Look for errors about:
   - Missing NEXTAUTH_SECRET
   - Database connection refused
   - Invalid NEXTAUTH_URL

**Need help getting DATABASE_URL?** Let me know which provider you're using (Supabase/Neon/Railway/etc.)
