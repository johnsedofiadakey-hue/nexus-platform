# 🚀 SalesNexus Deployment Guide

This guide outlines how to deploy the SalesNexus platform to production.

## 1. Prerequisites
-   **PostgreSQL Database** (e.g., Supabase, Neon, AWS RDS).
-   **Node.js 18+** (for local builds).
-   **Vercel Account** (Recommended for hosting).

## 2. Environment Variables (`.env.production`)
Set these in your hosting provider's dashboard:

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db?pgbouncer=true"
DIRECT_URL="postgresql://user:pass@host:5432/db"

# Auth (NextAuth)
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Intelligence
NEXT_PUBLIC_MAPBOX_TOKEN="pk.eyJ..."
PAYSTACK_SECRET_KEY="sk_live_..."

# Config
NODE_ENV="production"
```

## 3. Database Migration
Run this command from your local machine (connected to prod DB) or in your CI/CD pipeline:

```bash
# 1. Generate Client
npx prisma generate

# 2. Push Schema to Production DB
npx prisma db push
# OR if using migrations:
# npx prisma migrate deploy

# 3. Seed Initial Data (Optional - creates HQ)
npx prisma db seed

# ⚠️ CRITICAL: Create Super Admin
npx tsx src/lib/create-admin.ts
```

## 4. Deployment Checklists

### Vercel (Recommended)
1.  Import repository.
2.  Set Framework Preset to **Next.js**.
3.  Add Environment Variables.
4.  Deploy.
5.  **Post-Deploy**: Check "Function Logs" if API routes fail (usually DB connection issues).

### Docker / VPS
1.  Build image:
    ```bash
    docker build -t nexus-platform .
    ```
2.  Run container:
    ```bash
    docker run -p 3000:3000 --env-file .env.production nexus-platform
    ```

## 5. Verification
After deployment, verify the following:
1.  **Login**: Access `/auth/signin` and login as Admin.
2.  **Dashboard**: Ensure `/dashboard/map` loads without 500 errors.
3.  **Mobile**: Test `/mobilepos` on a mobile browser.
4.  **Webhooks**: Configure Paystack to point to `https://your-domain.com/api/payments/paystack`.

> **Troubleshooting**: If you see "Prisma Client not initialized", ensure `npx prisma generate` runs during the build command (Vercel does this automatically).
