# 🚀 Railway Deployment - Quick Reference

## Deploy Now (3 Steps)

### 1. Go to Railway
```
https://railway.app/new
```
- Connect GitHub: `johnsedofiadakey-hue/nexus-platform`
- Railway auto-detects: `nixpacks.toml` and `railway.json`

### 2. Add Environment Variables
Click service → Variables → Raw Editor → Paste:

```env
DATABASE_URL=postgresql://postgres.xxxxxxxxx:YOUR_PASSWORD@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xxxxxxxxx:YOUR_PASSWORD@aws-0-eu-west-1.aws.supabase.com:5432/postgres
NEXTAUTH_SECRET=YOUR_GENERATED_SECRET
NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Generate Domain & Deploy
- Settings → Generate Domain
- Deployment starts automatically
- Wait 6-9 min ☕

---

## Your URLs (After Deploy)

- **Admin Portal**: `https://nexus-admin-production.up.railway.app`
- **Agent Portal**: `https://nexus-agent-production.up.railway.app` (deploy separately)

---

## What Was Fixed ✅

1. Syntax error in IntelBoard.tsx
2. Missing dynamic export in auth route
3. Railway monorepo configuration (nixpacks.toml)
4. Next.js standalone output mode
5. Proper pnpm workspace support

---

## Check Deployment Status

```bash
# View logs (if using CLI)
railway logs

# Or check Railway dashboard
https://railway.app/dashboard
```

---

## If Build Fails

**Common Issue**: Missing DATABASE_URL

**Fix**: Make sure environment variables are set BEFORE deploying

**Rebuild**: Click "Redeploy" in Railway dashboard

---

## Automatic Deployments

Every git push triggers deployment:
```bash
git push origin main
```
Railway detects changes and deploys automatically! 🎉

---

## Cost

- **Free Tier**: $5 credit/month
- **Hobby**: $5/month + usage
- **Pro**: $20/month + usage

Start with free tier for testing!

---

**Ready to deploy? Head to Railway now! 🚂**
