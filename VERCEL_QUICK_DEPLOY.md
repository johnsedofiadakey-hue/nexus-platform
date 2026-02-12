# Vercel Quick Deployment Guide

## ⚡ Quick Start

### 1. Authenticate with Vercel
```bash
vercel login
```
Visit the URL shown and authenticate.

### 2. Run Deployment Script
```bash
chmod +x deploy-to-vercel.sh
./deploy-to-vercel.sh
```

The script will:
- ✅ Configure environment variables for both portals
- ✅ Deploy Admin Portal to production
- ✅ Deploy Agent Portal to production
- ✅ Provide deployment URLs

---

## 🔐 Environment Variables Configured

### Both Portals Receive:

```bash
DATABASE_URL="postgresql://postgres.lqkpyqcokdeaefmisgbs:[YOUR_PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

NEXTAUTH_SECRET="17hOqPIYhW7U08WAXcNQoo++MLxDypdJIKT1gg/qcLU="

NEXTAUTH_URL="<portal-specific-url>"
```

---

## 🚨 CRITICAL SECURITY TASKS

### ⚠️  URGENT: Database Password Previously Exposed

The previous password was committed to git history and is publicly visible.

**You MUST change it immediately:**

1. **Go to Supabase Dashboard**
   - Log in to supabase.com
   - Select your project: `lqkpyqcokdeaefmisgbs`
   - Go to Settings → Database
   - Click "Reset Database Password"

2. **Copy New Password**
   - Save it securely (use a password manager)

3. **Update DATABASE_URL Format**
   ```
   postgresql://postgres.lqkpyqcokdeaefmisgbs:NEW_PASSWORD@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
   ```

4. **Update Vercel Environment Variables**
   ```bash
   # Admin Portal
   cd apps/admin
   vercel env rm DATABASE_URL production --yes
   echo "NEW_DATABASE_URL" | vercel env add DATABASE_URL production --yes
   vercel --prod
   
   # Agent Portal
   cd ../agent
   vercel env rm DATABASE_URL production --yes
   echo "NEW_DATABASE_URL" | vercel env add DATABASE_URL production --yes
   vercel --prod
   ```

5. **Update Local .env**
   ```bash
   # Update your local .env file
   nano .env
   # Change DATABASE_URL to new password
   ```

---

## 📦 Manual Deployment (Alternative)

If the script doesn't work, deploy manually:

### Admin Portal
```bash
cd apps/admin

# Link project
vercel link

# Set environment variables
echo "YOUR_DATABASE_URL" | vercel env add DATABASE_URL production
echo "17hOqPIYhW7U08WAXcNQoo++MLxDypdJIKT1gg/qcLU=" | vercel env add NEXTAUTH_SECRET production
echo "YOUR_ADMIN_URL" | vercel env add NEXTAUTH_URL production

# Deploy
vercel --prod
```

### Agent Portal
```bash
cd apps/agent

# Link project
vercel link

# Set environment variables
echo "YOUR_DATABASE_URL" | vercel env add DATABASE_URL production
echo "17hOqPIYhW7U08WAXcNQoo++MLxDypdJIKT1gg/qcLU=" | vercel env add NEXTAUTH_SECRET production
echo "YOUR_AGENT_URL" | vercel env add NEXTAUTH_URL production

# Deploy
vercel --prod
```

---

## 🔍 Verify Deployment

### Check Build Status
```bash
# View recent deployments
vercel ls

# Inspect specific deployment
vercel inspect <deployment-url>

# View logs
vercel logs <deployment-url>
```

### Test Endpoints

**Admin Portal:**
```bash
# Test health
curl https://your-admin-url.vercel.app/api/health

# Test auth (should return 401 or session)
curl https://your-admin-url.vercel.app/api/auth/session
```

**Agent Portal:**
```bash
# Test health
curl https://your-agent-url.vercel.app/api/health

# Test auth (should return 401 or session)
curl https://your-agent-url.vercel.app/api/auth/session
```

---

## 🐛 Troubleshooting

### Build Fails with "Module not found: @prisma/client"

**Solution:** Already fixed! Our build configuration now runs `prisma generate` before build.

If it still fails:
```bash
# Check if Prisma dependencies are in package.json
cat apps/admin/package.json | grep prisma
cat apps/agent/package.json | grep prisma

# Should see:
# "@prisma/client": "^6.19.2"
# "prisma": "^6.19.2" (in devDependencies)
```

### Database Connection Fails

**Check DATABASE_URL:**
```bash
# View environment variables
vercel env ls

# Pull current variables
vercel env pull .env.vercel
cat .env.vercel
```

**Common issues:**
- Password contains special characters → URL encode them
- Wrong database host
- Firewall blocking Vercel IPs → Check Supabase connection pooling

### Environment Variables Not Available

**Verify turbo.json has globalEnv:**
```json
{
  "globalEnv": [
    "DATABASE_URL",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL"
  ]
}
```

**Check Vercel dashboard:**
1. Go to vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Ensure all variables are set for **Production**

---

## 📊 Post-Deployment Monitoring

### 1. Check Vercel Analytics
- Go to your project in Vercel dashboard
- Click "Analytics" tab
- Monitor page load times, errors

### 2. Check Function Logs
```bash
vercel logs --follow
```

### 3. Test Critical Features
- [ ] User login (Admin & Agent)
- [ ] Dashboard loads
- [ ] API routes respond
- [ ] Database queries work
- [ ] Mobile POS functions (Agent)
- [ ] GPS tracking (Agent)

### 4. Performance Verification
```bash
# Test response times
curl -w "@-" -o /dev/null -s https://your-url.vercel.app << 'EOF'
    time_namelookup:  %{time_namelookup}s\n
       time_connect:  %{time_connect}s\n
    time_appconnect:  %{time_appconnect}s\n
   time_pretransfer:  %{time_pretransfer}s\n
      time_redirect:  %{time_redirect}s\n
 time_starttransfer:  %{time_starttransfer}s\n
                    ----------\n
         time_total:  %{time_total}s\n
EOF
```

---

## 🎯 Success Checklist

After deployment, verify:

- [ ] Admin portal accessible at production URL
- [ ] Agent portal accessible at production URL
- [ ] Can log in as admin
- [ ] Can log in as agent
- [ ] Dashboard displays data
- [ ] No console errors in browser
- [ ] No 500 errors in Vercel logs
- [ ] Database queries executing successfully
- [ ] Authentication flow works
- [ ] Mobile POS interface loads (Agent)
- [ ] Database password has been rotated
- [ ] New DATABASE_URL updated in Vercel
- [ ] .env file updated locally with new password

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Turborepo on Vercel](https://vercel.com/docs/monorepos/turborepo)
- [Prisma on Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [NextAuth.js](https://next-auth.js.org/deployment)

---

## 🆘 Need Help?

If deployment fails:

1. **Check Vercel Build Logs**
   ```bash
   vercel logs <deployment-url> --follow
   ```

2. **Verify Environment Variables**
   ```bash
   vercel env ls
   ```

3. **Test Locally First**
   ```bash
   pnpm build:admin
   pnpm build:agent
   ```

4. **Check GitHub Actions** (if configured)
   - Go to repository → Actions tab
   - Look for failed workflows

---

**Generated:** February 8, 2026  
**Deployment Fixes:** Commit 8ac4752 & 40ef5b1  
**NEXTAUTH_SECRET:** 17hOqPIYhW7U08WAXcNQoo++MLxDypdJIKT1gg/qcLU=
