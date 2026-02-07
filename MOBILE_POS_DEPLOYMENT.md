# 🚀 Mobile POS Quick Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables (Critical!)
Set these in your Vercel project settings:

```bash
DATABASE_URL="postgresql://user:password@host:5432/database?pgbouncer=true&connection_limit=1"
NEXTAUTH_SECRET="[Generate with: openssl rand -base64 32]"
NEXTAUTH_URL="https://your-domain.vercel.app"
```

### 2. Database Requirements
- ✅ PostgreSQL 13+ with connection pooling
- ✅ All migrations applied
- ✅ At least 1 shop configured with GPS coordinates
- ✅ At least 1 mobile agent (role: WORKER/AGENT/ASSISTANT)
- ✅ Products seeded in shop inventory

### 3. Build Configuration
Vercel build command should be:
```bash
npm install --legacy-peer-deps && npx prisma generate && npm run build
```

## Post-Deployment Verification

### Step 1: Test Authentication
```bash
curl https://your-domain.vercel.app/api/auth/session
# Expected: 401 or session data if logged in
```

### Step 2: Test Mobile Init (After Login)
```bash
curl -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  https://your-domain.vercel.app/api/mobile/init
```

Expected response:
```json
{
  "id": "user_id",
  "agentName": "Agent Name",
  "shopId": "shop_id",
  "shopName": "Shop Name",
  "latitude": 5.6037,
  "longitude": -0.1870,
  "bypassGeofence": false
}
```

### Step 3: Run Diagnostic Tool
Navigate to: `https://your-domain.vercel.app/api/mobile/diagnostic`

Expected output:
```json
{
  "status": "success",
  "message": "All checks passed ✅",
  "checks": {
    "session": { "status": "✅ PASS" },
    "userProfile": { "status": "✅ PASS", "hasShop": true },
    "shopConfig": { "status": "✅ PASS", "hasInventory": true },
    "inventory": { "status": "✅ PASS" },
    "environment": { "status": "✅ PASS" }
  }
}
```

### Step 4: Test Transaction (Manual)
1. Login as mobile agent
2. Navigate to `/mobilepos/pos`
3. Add products to cart
4. Click checkout
5. Watch browser console for logs:
   - Should see: "💳 SERVER_ACTION: Initiating Sale"
   - Should see: "✅ SERVER_ACTION: Sale Completed"

## Common Issues & Fixes

### Issue: Refresh Loop
**Symptoms:** Login redirects back to login infinitely
**Cause:** Missing NEXTAUTH_SECRET or DATABASE_URL
**Fix:** Set environment variables in Vercel and redeploy

### Issue: "Not authenticated" on mobile init
**Symptoms:** Mobile app shows "Terminal Out of Sync"
**Cause:** Session not persisting across requests
**Fix:** 
1. Check NEXTAUTH_URL matches your domain exactly
2. Clear cookies and re-login
3. Verify secure cookies are enabled (HTTPS)

### Issue: Sales fail with "Product Not Found"
**Symptoms:** Checkout fails immediately
**Cause:** Product IDs in cart don't match database
**Fix:**
1. Run diagnostic endpoint
2. Check inventory exists
3. Clear cache: `localStorage.clear()` in browser console
4. Refresh mobile app

### Issue: GPS timeout blocks checkout
**Symptoms:** Checkout takes 3+ seconds or fails
**Fix:** Already patched in latest version - GPS now uses cache fallback

### Issue: Cart doesn't clear after shop reassignment
**Symptoms:** Agent reassigned but sees old shop's products in cart
**Fix:** Already patched - cart auto-clears on shop change

## Performance Benchmarks

Expected metrics on 4G connection:
- Initial load: < 3 seconds
- Time to Interactive: < 3 seconds
- Checkout processing: < 1 second
- Inventory refresh: < 500ms

If metrics are worse:
1. Check database connection latency
2. Verify Prisma connection pooling enabled
3. Check Vercel region matches database region
4. Consider upgrading Vercel plan for edge functions

## Monitoring

### Key Metrics to Watch
1. **Failed Transactions Rate:** Should be < 1%
2. **Average Checkout Time:** Should be < 2 seconds
3. **API 5xx Errors:** Should be 0
4. **Session Failures:** Should be < 0.1%

### Vercel Logs to Monitor
```bash
# Watch for these errors:
- "SERVER_ACTION_ERROR"
- "Auth failed"
- "Prisma connection error"
- "Invalid transaction data"
```

## Rollback Plan

If deployment fails:

### Option 1: Revert to Previous Deployment
1. Go to Vercel dashboard
2. Click "Deployments"
3. Find last working deployment
4. Click "..." → "Promote to Production"

### Option 2: Emergency Fix
```bash
git revert HEAD
git push
# Vercel will auto-deploy
```

## Support Contacts

- **Platform Issues:** support@nexusplatform.com
- **Emergency Deployment:** Deploy via Vercel CLI:
  ```bash
  vercel --prod
  ```

## Post-Launch Tasks

- [ ] Test on actual mobile devices (iOS & Android)
- [ ] Verify GPS accuracy in field
- [ ] Monitor transaction success rate
- [ ] Collect agent feedback
- [ ] Set up error alerting (Sentry/LogRocket)
- [ ] Schedule performance review in 1 week

---

**Last Updated:** January 2026  
**Version:** Mobile POS v2.0
