# 🔧 Personnel Portal Connection Fix

## Problem
When accessing the personnel portal from the admin panel, you see:
- **"Intelligence Link Severed"**
- **"Failed to sync records"**
- Buttons: "Retry Uplink" and "Return to Registry"

## Root Cause
The application cannot connect to the database because the required environment variables are not configured.

## Solution

### Quick Fix (Recommended)

1. **Run the automated fix script:**
   ```bash
   ./fix-personnel-portal.sh
   ```

2. **Follow the prompts to configure your database connection**

3. **Restart your development server:**
   ```bash
   npm run dev
   ```

### Manual Fix

1. **Edit the `.env` file in the project root**

2. **Add your PostgreSQL database URL:**
   ```env
   DATABASE_URL="postgresql://username:password@host:5432/database?schema=public"
   ```

3. **Generate and add NEXTAUTH_SECRET:**
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and add to `.env`:
   ```env
   NEXTAUTH_SECRET="paste-generated-secret-here"
   ```

4. **Set NEXTAUTH_URL:**
   ```env
   NEXTAUTH_URL="http://localhost:3000"
   ```

5. **Generate Prisma Client and sync database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

6. **Restart your server:**
   ```bash
   npm run dev
   ```

## Where to Get a Database URL

### Option 1: Supabase (Free, Recommended)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Project Settings → Database**
4. Copy the **Connection String** (use Transaction mode)
5. Paste into your `.env` file

### Option 2: Neon (Free)
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string from the dashboard
4. Paste into your `.env` file

### Option 3: Railway
1. Go to [railway.app](https://railway.app)
2. Create a new PostgreSQL database
3. Copy the **Postgres Connection URL**
4. Paste into your `.env` file

### Option 4: Local PostgreSQL
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/nexus_platform"
```

## Verification

After configuration, verify the fix:

1. **Check database connection:**
   ```bash
   npx prisma db execute --stdin <<< "SELECT 1;"
   ```

2. **Access the admin panel** and try opening a personnel portal

3. **You should see the member data load** instead of the error

## Technical Details

### API Endpoint
- **Route:** `/api/hr/member/[id]`
- **File:** `src/app/api/hr/member/[id]/route.ts`

### Frontend Component
- **Route:** `/dashboard/hr/member/[id]`
- **File:** `src/app/dashboard/hr/member/[id]/page.tsx`

### Error Flow
1. User clicks on a team member in admin panel
2. Browser navigates to `/dashboard/hr/member/[userId]`
3. Page component calls `/api/hr/member/[userId]`
4. API tries to connect to database using `DATABASE_URL`
5. If `DATABASE_URL` is missing or invalid, Prisma throws an error
6. API returns 500 error: "Failed to sync records"
7. Frontend displays: "Intelligence Link Severed"

## Still Having Issues?

### Check logs for specific errors:
```bash
# Check server logs in terminal where `npm run dev` is running
# Look for database connection errors or Prisma errors
```

### Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| `Environment variable not found: DATABASE_URL` | .env file missing or not loaded | Create/edit `.env` file with DATABASE_URL |
| `Can't reach database server` | Invalid database URL or server offline | Verify DATABASE_URL is correct and database is accessible |
| `prepared statement` error | Database connection pool issue | Restart your database or use a different connection string |
| `P2021` or `does not exist` | Schema out of sync | Run `npx prisma db push` |

### Debug Mode

Enable detailed error logging by adding to `.env`:
```env
DEBUG=prisma:*
NODE_ENV=development
```

## For Production Deployment

If deploying to Vercel/Railway/other platforms:

1. **Add environment variables in platform dashboard**
2. **Run database migrations:**
   ```bash
   npx prisma migrate deploy
   ```
3. **Verify NEXTAUTH_URL matches your production domain**

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete deployment instructions.
