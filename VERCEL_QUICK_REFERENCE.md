# Vercel Deployment Quick Reference

## 🚀 Deployment URLs

### Production URLs
- **Admin Portal:** https://nexus-admin-john-dakeys-projects.vercel.app
- **Agent Portal:** https://nexus-agent-john-dakeys-projects.vercel.app

### Vercel Dashboard Links
- **Admin Project:** https://vercel.com/john-dakeys-projects/nexus-admin
- **Agent Project:** https://vercel.com/john-dakeys-projects/nexus-agent

## 📦 Quick Commands

### Deploy Both Portals
```bash
git add .
git commit -m "Update both portals"
git push origin main
# Both admin and agent will auto-deploy
```

### Deploy Only Admin
```bash
# Make changes in apps/admin/
git add apps/admin/
git commit -m "Update admin portal"
git push origin main
# Only admin will rebuild
```

### Deploy Only Agent
```bash
# Make changes in apps/agent/
git add apps/agent/
git commit -m "Update agent portal"
git push origin main
# Only agent will rebuild
```

### Local Development
```bash
# Admin portal (localhost:3001)
pnpm dev:admin

# Agent portal (localhost:3002)
pnpm dev:agent

# Both portals simultaneously
pnpm dev  # Runs turbo dev (both apps)
```

### Build & Test Locally
```bash
# Build admin
pnpm build:admin

# Build agent
pnpm build:agent

# Build both
pnpm build
```

## 🔑 Environment Variables

### Already Configured for Both Portals

| Variable | Admin Value | Agent Value | Purpose |
|----------|------------|-------------|---------|
| `DATABASE_URL` | `postgresql://...6543/postgres` | `postgresql://...6543/postgres` | Supabase connection (pooled) |
| `NEXTAUTH_SECRET` | `SJkGuwDQCjUf0yYmGEIq...` | `SJkGuwDQCjUf0yYmGEIq...` | Auth encryption key |
| `NEXTAUTH_URL` | `https://nexus-admin-...` | `https://nexus-agent-...` | Auth callback URL |

### Add New Environment Variable via API
```bash
# For admin portal
curl -X POST 'https://api.vercel.com/v10/projects/nexus-admin/env' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"key":"NEW_VAR","value":"value","type":"encrypted","target":["production","preview","development"]}'

# For agent portal
curl -X POST 'https://api.vercel.com/v10/projects/nexus-agent/env' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"key":"NEW_VAR","value":"value","type":"encrypted","target":["production","preview","development"]}'
```

## 🔍 Monitoring & Logs

### View Deployment Status
```bash
# Admin
curl -s -H "Authorization: Bearer YOUR_TOKEN" \
  "https://api.vercel.com/v13/deployments?projectId=prj_0G2LUu3g7vaFzRsuDfoORMDfI6IE&limit=5"

# Agent
curl -s -H "Authorization: Bearer YOUR_TOKEN" \
  "https://api.vercel.com/v13/deployments?projectId=prj_3fSS5lEjW0viHd2aXmdAZFth5a6N&limit=5"
```

### Check Build Logs
1. Go to Vercel dashboard
2. Click on deployment
3. View real-time logs

### Monitor via CLI (if installed)
```bash
vercel logs nexus-admin --follow
vercel logs nexus-agent --follow
```

## 🛠️ Troubleshooting

### Build Fails
```bash
# Test build locally first
cd apps/admin && pnpm build  # or apps/agent
```

### Database Connection Issues
- Check `DATABASE_URL` in Vercel env vars
- Verify Supabase pooler is active (port 6543)
- Check Supabase dashboard for connection limits

### Authentication Not Working
- Verify `NEXTAUTH_URL` matches deployment URL
- Check `NEXTAUTH_SECRET` is set
- Clear browser cookies and try again

### Force Redeploy
Go to Vercel dashboard → Deployments → Click "..." → Redeploy

Or via API:
```bash
# Get latest deployment ID, then:
curl -X POST "https://api.vercel.com/v13/deployments/DEPLOYMENT_ID/redeploy" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 Project IDs

- **Admin Project ID:** `prj_0G2LUu3g7vaFzRsuDfoORMDfI6IE`
- **Agent Project ID:** `prj_3fSS5lEjW0viHd2aXmdAZFth5a6N`
- **Team ID:** `team_6tSdOMifMhAuKPFXW0587SLI`

## 🔗 API Endpoints

### Get Project Details
```bash
# Admin
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://api.vercel.com/v9/projects/nexus-admin"

# Agent
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://api.vercel.com/v9/projects/nexus-agent"
```

### List Deployments
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://api.vercel.com/v13/deployments?projectId=prj_0G2LUu3g7vaFzRsuDfoORMDfI6IE"
```

### Get Environment Variables
```bash
# Admin
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://api.vercel.com/v9/projects/nexus-admin/env"

# Agent
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://api.vercel.com/v9/projects/nexus-agent/env"
```

## 📱 Portal-Specific Routes

### Admin Portal Routes
- `/` - Landing page
- `/auth/signin` - Admin login
- `/dashboard` - Main admin dashboard
- `/super-user` - System admin panel
- `/staff` - Staff management
- `/dashboard/inventory` - Inventory management

### Agent Portal Routes
- `/` - Landing page
- `/auth/signin` - Agent login
- `/mobilepos` - Mobile POS dashboard
- `/mobilepos/pos` - Point of Sale
- `/mobilepos/attendance` - GPS attendance

## 🎯 Common Tasks

### Update Shared Components
```bash
# Edit component in packages/ui/
vim packages/ui/components/Button.tsx
git add packages/ui/
git commit -m "Update shared button component"
git push
# Both admin and agent will rebuild
```

### Update Database Schema
```bash
# Edit schema
vim packages/database/prisma/schema.prisma

# Generate Prisma client
cd packages/database
pnpm prisma generate

# Push to database
pnpm prisma db push

# Commit and deploy
git add packages/database/
git commit -m "Update database schema"
git push
# Both portals will get new schema
```

### Add New Admin Route
```bash
# Create new route
mkdir -p apps/admin/src/app/new-route
vim apps/admin/src/app/new-route/page.tsx
git add apps/admin/
git commit -m "Add new admin route"
git push
# Only admin will rebuild
```

### Add New Agent Feature
```bash
# Create new feature
mkdir -p apps/agent/src/app/mobilepos/new-feature
vim apps/agent/src/app/mobilepos/new-feature/page.tsx
git add apps/agent/
git commit -m "Add new agent feature"
git push
# Only agent will rebuild
```

## 🎉 Success Checklist

- ✅ Both portals deployed with separate URLs
- ✅ Environment variables configured
- ✅ Auto-deployment enabled from GitHub
- ✅ Database connection working
- ✅ Authentication configured
- ✅ Monorepo structure optimized for Vercel

---

**Last Updated:** $(date)
**Quick Help:** For deployment issues, check the [full guide](VERCEL_DEPLOYMENT_COMPLETE.md)
