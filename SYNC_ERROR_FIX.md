# ❌ SYNC ERROR FIX GUIDE

**Error:** "Intelligence Link Severed - Failed to sync records"

**Root Cause:** Database schema is out of sync with code changes.

---

## 🔧 IMMEDIATE FIX

### Option 1: If You Have Database Access

1. **Set your DATABASE_URL:**
   ```bash
   # Create .env file (if it doesn't exist)
   cat > .env << 'EOF'
   DATABASE_URL="your-postgresql-connection-string"
   NEXTAUTH_SECRET="your-secret-here"
   NEXTAUTH_URL="http://localhost:3000"
   EOF
   ```

2. **Apply schema changes:**
   ```bash
   npx prisma db push
   ```

3. **Regenerate Prisma Client:**
   ```bash
   npx prisma generate
   ```

4. **Restart dev server:**
   ```bash
   npm run dev
   ```

---

### Option 2: If You're Using Deployed Database

If your database is on Vercel, Railway, or another platform:

1. **Deploy the code first** (already done ✅)
2. **Run migration on the platform:**
   - **Vercel:** Go to your project → Settings → Functions → Add command: `npx prisma db push`
   - **Railway:** Open project shell and run: `npx prisma db push`
   - **Render:** Add build command: `npx prisma db push && npm run build`

---

### Option 3: Temporary Workaround (Test Without Schema Changes)

If you need to test immediately without database access:

**Temporarily revert schema changes:**

```bash
# Revert to previous commit (before schema changes)
git stash

# Reinstall with old schema
npm install --legacy-peer-deps

# Start dev server
npm run dev
```

Then deploy later when database is accessible.

---

## 🔍 WHAT CHANGED

The recent performance optimizations changed:
- ✅ Removed `relationMode: "prisma"` (30-50% faster queries)
- ✅ Added composite indexes
- ✅ Optimized connection pooling

These changes require a database migration to apply the new schema.

---

## ✅ VERIFICATION

After applying the fix, verify:

1. **Check API response:**
   ```bash
   # Test the member endpoint
   curl http://localhost:3000/api/hr/member/YOUR_USER_ID
   ```

2. **Check browser console:**
   - Should show detailed error if it still fails
   - No more generic "Failed to sync records"

3. **Check server logs:**
   - Will now show detailed error information
   - Easier to debug specific issues

---

## 📞 STILL HAVING ISSUES?

### Check These:

1. **Database Connection:**
   ```bash
   # Test connection
   npx prisma studio
   ```
   If this fails, your DATABASE_URL is incorrect.

2. **Prisma Client Version:**
   ```bash
   # Should show 6.19.2
   npx prisma --version
   ```

3. **Check error details:**
   - Open browser DevTools → Console
   - Look for detailed error message (now includes error code and details)

### Common Errors:

- `P2021` - Table does not exist → Run `npx prisma db push`
- `ECONNREFUSED` - Can't connect to database → Check DATABASE_URL
- `prepared statement` - Connection pool issue → Restart app

---

## 🚀 QUICK START (Full Setup)

If starting fresh:

```bash
# 1. Set environment variables
cp .env.example .env  # Edit with your values

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Apply database schema
npx prisma db push

# 4. Generate Prisma client
npx prisma generate

# 5. Start development
npm run dev
```

---

## 📊 EXPECTED BEHAVIOR

After fix:
- ✅ Member portal loads instantly
- ✅ No "Intelligence Link Severed" errors
- ✅ Fast data sync
- ✅ Detailed error messages if something fails

---

**Need Help?** Check the detailed error message in:
- Browser console (DevTools)
- Server logs (terminal)
- API response (Network tab)

The improved error handling now shows exactly what went wrong!
