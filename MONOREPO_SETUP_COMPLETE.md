# 🎉 Monorepo Restructure Complete!

## What Changed

Your Nexus Platform has been restructured into a **monorepo** with two independent applications:

### 🏢 **Admin Portal** (`apps/admin`)
- **URL**: `admin.your-domain.com`
- **Dev Port**: 3001
- **Features**: Dashboard, HR Management, Inventory, System Config
- **Users**: Admins, HR Managers, Inventory Managers

### 📱 **Agent Portal** (`apps/agent`)
- **URL**: `app.your-domain.com`
- **Dev Port**: 3002
- **Features**: Mobile POS, GPS Attendance, Field Operations
- **Users**: Field Agents, Shop Managers

## Architecture Benefits

✅ **Security**: Agents can't access admin URLs  
✅ **Independent Deployment**: Update one without affecting the other  
✅ **Optimized for Purpose**: Mobile-first for agents, desktop for admins  
✅ **Code Reuse**: Shared database, components, and utilities  
✅ **Scalability**: Scale each portal independently on Vercel

## Quick Start

### Development

```bash
# Run both apps
pnpm dev

# Run specific app
pnpm dev:admin    # Admin on http://localhost:3001
pnpm dev:agent    # Agent on http://localhost:3002
```

### Building

```bash
# Build all
pnpm build

# Build specific app
pnpm build:admin
pnpm build:agent
```

## Deployment on Vercel

### Step 1: Deploy Admin Portal

1. Go to Vercel Dashboard → **New Project**
2. Import your GitHub repository
3. **Project Settings**:
   - **Project Name**: `nexus-admin`
   - **Framework**: Next.js
   - **Root Directory**: `apps/admin`
   - **Build Command**: (leave default)
   - **Output Directory**: (leave default)

4. **Environment Variables**:
   ```
   DATABASE_URL=postgresql://postgres.lqkpyqcokdeaefmisgbs:Sedofia1010.@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
   NEXTAUTH_URL=https://admin-your-project.vercel.app
   NEXTAUTH_SECRET=SJkGuwDQCjUf0yYmGEIq+1as58oSJ7M9kjjdeUdpbUk=
   ```

5. Click **Deploy**

6. After deployment, go to **Settings** → **Domains** → Add custom domain:
   - `admin.your-domain.com`

7. **Update NEXTAUTH_URL** to your custom domain:
   - Change to: `https://admin.your-domain.com`
   - Redeploy

### Step 2: Deploy Agent Portal

1. Go to Vercel Dashboard → **New Project** (create another project)
2. Import the **same** GitHub repository
3. **Project Settings**:
   - **Project Name**: `nexus-agent`  
   - **Framework**: Next.js
   - **Root Directory**: `apps/agent`
   - **Build Command**: (leave default)
   - **Output Directory**: (leave default)

4. **Environment Variables**:
   ```
   DATABASE_URL=postgresql://postgres.lqkpyqcokdeaefmisgbs:Sedofia1010.@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
   NEXTAUTH_URL=https://agent-your-project.vercel.app
   NEXTAUTH_SECRET=SJkGuwDQCjUf0yYmGEIq+1as58oSJ7M9kjjdeUdpbUk=
   ```

5. Click **Deploy**

6. After deployment, go to **Settings** → **Domains** → Add custom domain:
   - `app.your-domain.com`

7. **Update NEXTAUTH_URL** to your custom domain:
   - Change to: `https://app.your-domain.com`
   - Redeploy

## Important Notes

### Database Connection
- Both apps use the **same** DATABASE_URL
- They sync automatically through the shared Supabase database
- No additional configuration needed

### Authentication
- Each app has its own NEXTAUTH_URL
- Users can log in to either portal based on their role
- Sessions are stored in the shared database

### Automatic Deployments
- Vercel will **automatically redeploy** both apps when you push to GitHub
- Each app deploys independently
- If one fails, the other is unaffected

## Custom Domain Setup

### Option 1: Subdomains (Recommended)
- Admin: `admin.your-domain.com`
- Agent: `app.your-domain.com`

In your domain DNS settings:
```
Type    Name     Value
CNAME   admin    cname.vercel-dns.com
CNAME   app      cname.vercel-dns.com
```

### Option 2: Different Domains
- Admin: `nexus-admin.com`
- Agent: `nexus-app.com`

Each domain configured separately in Vercel.

## Structure Overview

```
nexus-platform/
├── apps/
│   ├── admin/                 # Admin Portal
│   │   ├── src/app/
│   │   │   ├── dashboard/     # Dashboard routes
│   │   │   ├── super-user/    # Super user routes
│   │   │   ├── staff/         # Staff routes
│   │   │   └── api/           # API routes
│   │   ├── package.json       # Admin dependencies
│   │   ├── vercel.json        # Vercel config
│   │   └── README.md
│   │
│   └── agent/                 # Agent Portal
│       ├── src/app/
│       │   ├── mobilepos/     # Mobile POS routes
│       │   └── api/           # API routes
│       ├── package.json       # Agent dependencies
│       ├── vercel.json        # Vercel config
│       └── README.md
│
├── packages/
│   ├── database/              # Shared Prisma schema
│   │   ├── prisma/
│   │   │   └── schema.prisma  # Database schema
│   │   └── index.ts           # Exports PrismaClient
│   │
│   └── ui/                    # Shared UI components
│       ├── components/
│       └── index.tsx
│
├── turbo.json                 # Turborepo config
├── pnpm-workspace.yaml        # pnpm workspace config
└── package.json               # Root package.json
```

## Development Workflow

### Making Changes

**Admin-only changes**:
```bash
# Make changes in apps/admin/
pnpm dev:admin  # Test locally
git commit -m "feat(admin): add new feature"
git push        # Vercel auto-deploys admin only
```

**Agent-only changes**:
```bash
# Make changes in apps/agent/
pnpm dev:agent  # Test locally
git commit -m "feat(agent): add new feature"
git push        # Vercel auto-deploys agent only
```

**Database changes** (affects both):
```bash
# Edit packages/database/prisma/schema.prisma
pnpm db:push      # Update database
pnpm db:generate  # Generate Prisma client
git commit -m "feat(database): add new model"
git push          # Both apps auto-redeploy
```

## Testing

### Local Testing

```bash
# Terminal 1: Admin
cd apps/admin
pnpm dev

# Terminal 2: Agent
cd apps/agent
pnpm dev
```

Visit:
- Admin: http://localhost:3001
- Agent: http://localhost:3002

### Production Testing

After deployment:
- Admin: https://admin.your-domain.com
- Agent: https://app.your-domain.com

Test both independently to ensure separation.

## Troubleshooting

### Build Fails on Vercel

**Check**:
1. Root Directory is set correctly (`apps/admin` or `apps/agent`)
2. All environment variables are set
3. Build logs for specific errors

**Fix**:
```bash
# Test build locally first
pnpm build:admin
pnpm build:agent
```

### Database Connection Issues

**Check**:
1. DATABASE_URL is the pooled connection (port 6543)
2. Same DATABASE_URL in both apps
3. Supabase project is active

**Test**:
```bash
cd packages/database
pnpm db:push
```

### Authentication Issues

**Check**:
1. NEXTAUTH_URL matches the deployed URL
2. NEXTAUTH_SECRET is the same in both apps
3. No trailing slashes in NEXTAUTH_URL

## Migration from Old Structure

### What Happened to Original Files?
- Original files are still in `src/` and `prisma/` directories
- They can be safely deleted after confirming both apps work
- Keep them for now as a backup

### Cleanup (Optional)

Once both apps are deployed and working:
```bash
# Backup first!
git tag v1-monolith  # Create a tag to revert if needed

# Remove old structure
rm -rf src/
rm -rf prisma/  # Keep if you want, not used anymore
```

## Performance

### Expected Improvements

- **Load Time**: Agents get lighter mobile-optimized bundle
- **Security**: Smaller attack surface per app
- **Deploy Speed**: Only affected app rebuilds
- **Scaling**: Each app scales independently

### Monitoring

Monitor both apps separately in Vercel:
- Admin analytics
- Agent analytics
- Database connection pooling in Supabase

## Support

### Documentation
- [Monorepo README](./MONOREPO_README.md)
- [Admin Portal README](./apps/admin/README.md)
- [Agent Portal README](./apps/agent/README.md)

### Common Commands
```bash
pnpm dev              # Run both apps
pnpm build            # Build both apps
pnpm lint             # Lint both apps
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Update database schema
pnpm clean            # Clean all build artifacts
```

## Next Steps

1. ✅ **Commit Changes**:
   ```bash
   git add .
   git commit -m "refactor: restructure into monorepo with admin and agent portals"
   git push
   ```

2. ✅ **Deploy Admin Portal** on Vercel (see Step 1 above)

3. ✅ **Deploy Agent Portal** on Vercel (see Step 2 above)

4. ✅ **Set up Custom Domains**

5. ✅ **Test Both Apps** independently

6. 🎉 **Go Live!**

---

**Created**: February 8, 2026  
**Status**: ✅ Complete and ready to deploy  
**By**: GitHub Copilot
