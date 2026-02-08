# 🚀 Nexus Platform - Deployment Instructions

## ✅ Step 1: GitHub Push Complete

Your code has been successfully pushed to GitHub:
- **Repository:** https://github.com/johnsedofiadakey-hue/nexus-platform
- **Branch:** main
- **Latest Commits:**
  - `1373fdf` - Comprehensive system audit report
  - `9257037` - Additional vulnerability fixes
  - `1976f8c` - Critical vulnerability patches

---

## 🔴 CRITICAL: Security Action Required BEFORE Deployment

### ⚠️ ROTATE DATABASE PASSWORD IMMEDIATELY

The database password `Sedofia1010.` was exposed in git history and MUST be changed before deploying:

### Steps to Rotate Password:

#### If using Supabase:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **Database**
4. Click **Reset Database Password**
5. Generate a new strong password
6. Save it securely
7. Update your DATABASE_URL

#### If using Neon/Railway/AWS RDS:
1. Go to your database provider dashboard
2. Navigate to database settings
3. Change/reset the password
4. Update your DATABASE_URL with the new password

#### Generate a Strong Password:
```bash
openssl rand -base64 32
```

---

## 📦 Step 2: Choose Your Deployment Platform

### Option A: Vercel (Recommended for Next.js)

#### 2.1: Connect GitHub Repository

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Click **"Add New"** → **"Project"**

2. **Import Git Repository**
   - Select **"Import Git Repository"**
   - Choose: `johnsedofiadakey-hue/nexus-platform`
   - Click **"Import"**

3. **Configure Project**
   - **Framework Preset:** Next.js
   - **Root Directory:** Leave as `.` (monorepo root)
   - **Build Command:** `pnpm run build`
   - **Output Directory:** Leave default
   - **Install Command:** `pnpm install`

#### 2.2: Set Environment Variables

Click **"Environment Variables"** and add these:

**🔴 CRITICAL - Use NEW Database Password:**
```
DATABASE_URL=postgresql://postgres.xxxxx:NEW_PASSWORD_HERE@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**🔑 Generate Auth Secret:**
```bash
openssl rand -base64 32
```
Copy the output and add:
```
NEXTAUTH_SECRET=<paste-generated-secret-here>
```

**🌐 Set App URL:**
```
NEXTAUTH_URL=https://your-app-name.vercel.app
```
*Note: Vercel will show you the URL after deployment. You can update this later.*

**✅ Select Environments:** Check all 3 boxes:
- ✅ Production
- ✅ Preview  
- ✅ Development

#### 2.3: Deploy Admin Portal

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. You'll get a URL like: `https://nexus-platform-xxxxx.vercel.app`
4. **Go back to Settings → Environment Variables**
5. **Update NEXTAUTH_URL** with your actual deployment URL
6. **Redeploy:** Deployments tab → Latest → "Redeploy"

#### 2.4: Deploy Agent Portal (Second Deployment)

For the agent portal, you need a separate deployment:

1. **Add New Project** again in Vercel
2. **Import same repository:** `johnsedofiadakey-hue/nexus-platform`
3. **Configure differently:**
   - **Root Directory:** `apps/agent`
   - Build settings stay the same
4. **Add same environment variables** (use same DATABASE_URL and NEXTAUTH_SECRET)
5. **Set NEXTAUTH_URL** for agent portal: `https://agent-portal-xxxxx.vercel.app`
6. Deploy

---

### Option B: Railway (Alternative)

Railway configuration is already in `railway.json`:

1. **Go to Railway Dashboard**
   - Visit: https://railway.app/dashboard
   - Click **"New Project"** → **"Deploy from GitHub repo"**

2. **Connect Repository**
   - Select `johnsedofiadakey-hue/nexus-platform`
   - Railway will detect the `railway.json` config

3. **Set Environment Variables** (same as above)
   - DATABASE_URL (with NEW password)
   - NEXTAUTH_SECRET
   - NEXTAUTH_URL

4. **Deploy**

---

## 📋 Step 3: Database Migration

After deployment, run database migrations:

```bash
# From your local machine/codespace
npx prisma db push
```

Or use Vercel CLI:
```bash
vercel env pull .env.local
npx prisma db push
```

---

## 🧪 Step 4: Test Deployment

### Admin Portal Tests:
1. **Visit:** `https://your-admin-url.vercel.app`
2. **Verify:** Login page loads (no refresh loop)
3. **Test Login:** Use your admin credentials
4. **Check Dashboard:** Should load without errors
5. **Test API:** Navigate through features

### Agent Portal Tests:
1. **Visit:** `https://your-agent-url.vercel.app`
2. **Verify:** Mobile POS interface loads
3. **Test Login:** Agent credentials should work
4. **Check Sync:** Test GPS tracking, sales entry

---

## 🔒 Step 5: Post-Deployment Security Checklist

### Immediate Actions:
- [ ] **Verify** new database password is working
- [ ] **Confirm** old password (`Sedofia1010.`) is no longer in DATABASE_URL
- [ ] **Test** authentication on both portals
- [ ] **Review** Vercel function logs for errors

### Environment Variable Verification:
```bash
# Check which variables are set (doesn't show values)
vercel env ls
```

### Monitor First 24 Hours:
- [ ] Check error logs in Vercel dashboard
- [ ] Monitor database connection pool
- [ ] Watch for failed authentication attempts
- [ ] Verify GPS tracking works
- [ ] Test sales transactions

---

## 🐛 Troubleshooting

### Issue: "Refresh Loop" on Login Page
**Cause:** Missing NEXTAUTH_SECRET or NEXTAUTH_URL  
**Fix:** 
1. Verify environment variables are set in Vercel
2. Ensure you selected all 3 environments (Production/Preview/Dev)
3. Redeploy with cache cleared

### Issue: "Database Connection Failed"
**Cause:** Incorrect DATABASE_URL or wrong password  
**Fix:**
1. Verify you updated to NEW database password
2. Check connection string format
3. Test connection locally first
4. Ensure database allows connections from Vercel IPs

### Issue: "Unauthorized" or 401 Errors
**Cause:** NEXTAUTH_URL doesn't match actual deployment URL  
**Fix:**
1. Get exact URL from Vercel deployment
2. Update NEXTAUTH_URL environment variable
3. Redeploy

### Issue: Build Fails with "Cannot find module"
**Cause:** Missing dependencies  
**Fix:**
1. Check Vercel build logs
2. Verify `package.json` has all dependencies
3. Try: Deployments → Redeploy → Uncheck "Use existing cache"

---

## 📊 Monitoring & Observability

### Vercel Dashboard:
- **Analytics:** View traffic, response times, error rates
- **Logs:** Real-time function logs for debugging
- **Deployments:** History of all deploys

### Recommended Setup:
1. **Sentry** for error tracking
   ```bash
   pnpm add @sentry/nextjs
   ```

2. **Vercel Speed Insights**
   - Already integrated with Vercel deployments
   - View in Vercel dashboard

3. **Database Monitoring**
   - Enable query logging in Supabase
   - Set up connection pool alerts

---

## 🚀 Deployment URLs

After successful deployment, you'll have:

- **Admin Portal:** `https://nexus-admin-xxxxx.vercel.app`
- **Agent Portal:** `https://nexus-agent-xxxxx.vercel.app`
- **API Endpoints:** Both portals have `/api/*` routes

### Custom Domains (Optional):
1. Go to Vercel Project → Settings → Domains
2. Add your custom domain: `admin.yourdomain.com`
3. Update DNS records as instructed
4. Add another domain: `agent.yourdomain.com`
5. Update NEXTAUTH_URL environment variables
6. Redeploy both portals

---

## ✅ Deployment Checklist

- [ ] GitHub repository pushed successfully
- [ ] Database password rotated (NEW password set)
- [ ] Vercel project created for admin portal
- [ ] Vercel project created for agent portal
- [ ] Environment variables set (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL)
- [ ] Database migrations applied (prisma db push)
- [ ] Admin portal deployed and tested
- [ ] Agent portal deployed and tested
- [ ] Login works on both portals
- [ ] GPS tracking functional
- [ ] Sales transactions working
- [ ] No errors in Vercel logs
- [ ] Old database password confirmed inactive

---

## 📞 Support

If you encounter issues:

1. **Check Logs:**
   ```bash
   vercel logs
   ```

2. **Review Audit Report:**
   - See `COMPREHENSIVE_AUDIT_REPORT.md` for known issues

3. **Common Solutions:**
   - Redeploy with cache cleared
   - Verify environment variables
   - Check database connectivity
   - Review function logs in Vercel

---

## 🎉 Next Steps After Deployment

1. **Setup Monitoring:** Configure Sentry for error tracking
2. **Enable Analytics:** Turn on Vercel Analytics
3. **Performance Testing:** Load test critical endpoints
4. **User Testing:** Onboard beta testers
5. **Documentation:** Update user guides with production URLs
6. **Backup Strategy:** Setup automated database backups
7. **CI/CD:** Configure automatic deployments on push to main

---

**Deployment Status:** 🟡 Ready to Deploy (Pending database password rotation)  
**Estimated Time:** 15-20 minutes  
**Difficulty:** Moderate  

**🔴 REMEMBER: Rotate database password BEFORE deploying!**
