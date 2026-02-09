# 🚂 Railway Deployment Guide

## Quick Deploy to Railway

Your Nexus Platform is now configured for Railway deployment with proper monorepo support.

### Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Connected to Railway
3. **Database**: Supabase PostgreSQL (already configured)

---

## Deployment Steps

### Option 1: Deploy via Railway Dashboard (Recommended)

1. **Create New Project**
   - Go to [railway.app/new](https://railway.app/new)
   - Click "Deploy from GitHub repo"
   - Select `johnsedofiadakey-hue/nexus-platform`
   - Railway will auto-detect the configuration

2. **Configure Environment Variables**

   Click on your service → Variables → Add the following:

   ```bash
   # Database Connection (from Supabase)
   DATABASE_URL=postgresql://postgres:[password]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   DIRECT_URL=postgresql://postgres:[password]@aws-0-eu-west-1.aws.supabase.com:5432/postgres

   # Authentication
   NEXTAUTH_SECRET=your-generated-secret-key
   NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}

   # Supabase (if used)
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

   **Generate NEXTAUTH_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

3. **Deploy**
   - Railway will automatically:
     - Install dependencies with `pnpm`
     - Generate Prisma client
     - Build the admin app
     - Start the application

4. **Get Your URL**
   - Click on "Settings" → "Generate Domain"
   - Your app will be available at: `https://your-app.up.railway.app`

---

### Option 2: Deploy via Railway CLI

1. **Install Railway CLI**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   cd /workspaces/nexus-platform
   railway init
   ```

4. **Set Environment Variables**
   ```bash
   railway variables set DATABASE_URL="postgresql://..."
   railway variables set NEXTAUTH_SECRET="$(openssl rand -base64 32)"
   railway variables set NEXTAUTH_URL="https://your-app.up.railway.app"
   ```

5. **Deploy**
   ```bash
   railway up
   ```

---

## Configuration Files

Your monorepo is configured with:

### ✅ `nixpacks.toml`
```toml
[phases.setup]
nixPkgs = ["nodejs_20", "pnpm"]

[phases.install]
cmds = ["pnpm install --frozen-lockfile"]

[phases.build]
cmds = [
  "pnpm run db:generate",
  "pnpm run build:admin"
]

[start]
cmd = "cd apps/admin && pnpm start"
```

### ✅ `railway.json`
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm i --frozen-lockfile && pnpm run db:generate && pnpm run build:admin"
  },
  "deploy": {
    "startCommand": "cd apps/admin && pnpm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## Deploying Both Admin and Agent Portals

Since this is a monorepo with two apps, you'll need to create **two Railway services**:

### Service 1: Admin Portal

1. Create first service with current configuration (already done above)
2. This deploys `apps/admin`

### Service 2: Agent Portal

1. In Railway dashboard, click "+ New Service"
2. Select the same GitHub repo
3. In service settings, update the configuration:

**Build Command:**
```bash
pnpm i --frozen-lockfile && pnpm run db:generate && pnpm run build:agent
```

**Start Command:**
```bash
cd apps/agent && pnpm start
```

**Environment Variables:** (Same as admin, but update `NEXTAUTH_URL` to agent's domain)

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Supabase connection (pooler) | `postgresql://...pooler.supabase.com:6543/...` |
| `DIRECT_URL` | Direct database connection | `postgresql://...aws.supabase.com:5432/...` |
| `NEXTAUTH_SECRET` | Auth encryption key | Generated with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your Railway domain | `https://your-app.up.railway.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | `eyJhbG...` |

---

## Automatic Deployments

Railway automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "feat: new feature"
git push origin main
```

Railway will:
1. Detect the push
2. Trigger a new build
3. Run tests (if configured)
4. Deploy automatically

---

## Monitoring & Logs

### View Logs
- **Dashboard**: Click on your service → "Deployments" → Recent deployment
- **CLI**: `railway logs`

### Monitor Resource Usage
- **Dashboard**: Click on your service → "Metrics"
- Shows CPU, Memory, Network usage

---

## Troubleshooting

### Build Fails with Prisma Error
**Solution**: Ensure `DATABASE_URL` is set in environment variables. Railway needs it at build time.

### Port Already in Use
**Solution**: Railway automatically assigns ports. Make sure your `package.json` start script doesn't hardcode ports for production:

```json
{
  "scripts": {
    "start": "next start -p ${PORT:-3001}"
  }
}
```

### Monorepo Build Issues
**Solution**: Verify `nixpacks.toml` and `railway.json` are at the monorepo root (not inside `apps/`).

### Environment Variables Not Loading
**Solution**: 
- Restart the service after adding variables
- Use Railway's `${{VARIABLE_NAME}}` syntax for referencing variables

---

## Cost Optimization

Railway offers:
- **Free Tier**: $5 credit/month (good for testing)
- **Developer Plan**: $5/month per plugin + usage
- **Pro Plan**: $20/month + usage

**Tips to Save:**
- Use Supabase for database (included in their free tier)
- Deploy to one service first, add second when needed
- Monitor usage in Railway dashboard

---

## Next Steps

1. ✅ **Deploy Admin Portal** - Follow steps above
2. ⚙️ **Configure Domain** - Add custom domain if needed
3. 🚀 **Deploy Agent Portal** - Create second service
4. 📊 **Monitor Performance** - Check logs and metrics
5. 🔐 **Enable HTTPS** - Automatic with Railway domains

---

## Support

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Nixpacks Docs**: https://nixpacks.com

---

**Your deployment is configured and ready to go! 🎉**
