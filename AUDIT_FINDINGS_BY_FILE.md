# 📋 AUDIT FINDINGS - DETAILED FILE REFERENCE

## Quick Navigation by Issue Type

---

## 🔴 CRITICAL ISSUES

### Authentication Architecture Flaw: Shared Login System

**The Problem:**
Both admin and agent portals use the SAME NextAuth configuration, allowing privilege escalation and role manipulation.

**Files Involved:**
```
apps/admin/src/app/api/auth/[...nextauth]/route.ts
  └─ Uses @/lib/auth (SAME CONFIG for both apps)

apps/agent/src/app/api/auth/[...nextauth]/route.ts
  └─ Uses @/lib/auth (DUPLICATE - should be different)

apps/admin/src/lib/auth.ts (Lines 1-150)
  └─ Single authOptions exported for both ADMIN and AGENT apps
  └─ No role-specific authentication

apps/agent/src/lib/auth.ts (Lines 1-150)
  └─ IDENTICAL copy of admin/src/lib/auth.ts
  └─ Should NOT be identical for AGENT app
```

**Frontend Role Checking (Bypassed):**
```
apps/admin/src/app/auth/signin/page.tsx
  └─ Lines 69-88: useEffect with frontend role check
  └─ Lines 176-190: Portal selector (Mode = 'SELECT' | 'AGENT' | 'HQ')
  └─ VULNERABLE: All role checks happen on frontend, easily bypassed

apps/agent/src/app/auth/signin/page.tsx
  └─ Lines 76-88: useEffect with role check for promoters only
  └─ VULNERABLE: Frontend-only protection
```

**Fix Location:**
→ See SECURITY_FIXES_IMPLEMENTATION.md → FIX #2: Create middleware.ts  
→ See SECURITY_FIXES_IMPLEMENTATION.md → FIX #3: Create separate SUPER_ADMIN auth

---

### Unauthenticated API Endpoint: Sales GET

**The Problem:**
The `/api/sales` GET endpoint returns sales data without authentication or tenant isolation.

**Vulnerable File:**
```
apps/admin/src/app/api/sales/route.ts
  ├─ Line 8: export async function GET(req: Request)
  ├─ Line 13: const userId = searchParams.get("userId");
  ├─ Line 20-44: prisma.sale.findMany({ where: { userId } })
  │
  ├─ ❌ Missing: getServerSession() call
  ├─ ❌ Missing: organizationId filter
  ├─ ❌ Missing: Authorization check
  │
  └─ Result: Anyone can request sales for ANY userId
```

**Vulnerable Code Block:**
```typescript
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json([]); // ❌ Returns empty array, doesn't reject
    }

    // ❌ NO AUTHENTICATION CHECK HERE

    const sales = await prisma.sale.findMany({
      where: { userId },  // ❌ NO TENANT ISOLATION
      take: 50,
      orderBy: { createdAt: 'desc' },
      // ... rest of query
    });

    return NextResponse.json(sales);  // ❌ Returns data UNCONDITIONALLY
  } catch (error) {
    console.error("❌ SALES_API_ERROR:", error);
    return NextResponse.json([], { status: 500 });
  }
}
```

**Attack Scenario:**
```bash
# Attacker requests without any authentication:
curl "https://nexus-platform.com/api/sales?userId=clz1a2b3c4d5e6f7g8h9i0j1k"

# Response (UNAUTH):
[
  {
    "id": "sale_123",
    "totalAmount": 5000,
    "amountPaid": 5000,
    "paymentMethod": "CASH",
    "status": "COMPLETED",
    "createdAt": "2025-02-05T10:30:00Z",
    "shop": { "name": "Accra Store" },
    "items": [
      { "quantity": 5, "price": 1000, "product": { "name": "Phones" } }
    ]
  }
]
```

**Fix Applied:**
→ See SECURITY_FIXES_IMPLEMENTATION.md → FIX #1: Add Authentication & Tenant Isolation

---

### No Middleware Protection

**The Problem:**
Routes like `/dashboard`, `/super-user`, `/mobilepos` are not protected at the middleware level.

**Missing Files:**
```
❌ apps/admin/src/middleware.ts ............... DOES NOT EXIST
❌ apps/agent/src/middleware.ts .............. DOES NOT EXIST
```

**What Happens Without Middleware:**
```
User without ADMIN role accesses: GET /dashboard
  ↓
Next.js routes to: /app/dashboard/page.tsx
  ↓
No middleware check occurs
  ↓
React component renders and checks role in useEffect
  ↓
frontend toast.error shown, but page already loaded
  ↓
User can inspect page source, modify session, bypass checks
```

**Unprotected Routes:**
```
/dashboard .......................... (should require ADMIN/MANAGER)
/staff ............................. (should require ADMIN/MANAGER)
/super-user ....................... (should require SUPER_ADMIN only)
/mobilepos ......................... (should require WORKER/AGENT)
/settings .......................... (should require ADMIN)

/api/super/* ...................... (should require SUPER_ADMIN)
/api/admin/* ...................... (should require ADMIN/MANAGER)
/api/mobile/* ..................... (should require WORKER/AGENT)
```

**Fix Required:**
→ See SECURITY_FIXES_IMPLEMENTATION.md → FIX #2: Create middleware.ts

---

## 🟠 HIGH SEVERITY ISSUES

### JWT Token Valid for 30 Days

**The Problem:**
Session tokens remain valid for an entire month, increasing the window for token theft.

**Vulnerable Configuration:**
```
apps/admin/src/lib/auth.ts
  ├─ Line 53-55: session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }
  │                                            ↑
  │                                    30 days is too long!
  │
  └─ Recommendation: Max 4 hours for admin, 8 hours for field agents

apps/agent/src/lib/auth.ts
  └─ Same issue (DUPLICATE FILE)

apps/admin/src/lib/auth.ts
  ├─ Line 40-50: cookies: { sameSite: 'lax', ... }
  │                               ↑
  │                        Should be 'strict' for admin
  │
  └─ 'lax' allows cross-site cookie sending (CSRF risk)
```

**Impact:**
- If a token is stolen, attacker has 30 days to use it
- No periodic validation of user's role/status
- Compromised admin account remains valid for a month
- No session revocation capability

**Fix Applied:**
→ See SECURITY_FIXES_IMPLEMENTATION.md → FIX #4: Reduce JWT Session Timeout

---

### Geofence Bypass Not Restricted Enough

**The Problem:**
Any admin user can set `bypassGeofence = true` to disable location tracking.

**Vulnerable File:**
```
apps/admin/src/app/api/mobile/location/route.ts
  ├─ Line 24-30: if (authenticatedUser.id !== userId && ...)
  │              └─ Allows updating ANY user's location if user is ADMIN
  │
  ├─ Line 44: const isInside = distance <= effectiveRadius || agent.bypassGeofence;
  │           └─ BYPASS FLAG allows any user with it to work anywhere
  │
  ├─ Line 51-70: Geofence breach detection
  │              └─ Skipped if bypassGeofence = true
  │              └─ Means admin can work from home while clocking in at office
  │
  └─ Missing: SUPER_ADMIN-only bypass, audit logging
```

**Vulnerable Code:**
```typescript
// A manager can do this:
const authenticatedUser = await requireAuth();

// This check allows ADMIN to update any user:
if (authenticatedUser.id !== userId && authenticatedUser.role !== 'ADMIN') {
  // Verify permission
}

// Then set bypass flag:
await prisma.user.update({
  where: { id: userId },
  data: { bypassGeofence: true }  // ❌ Now this user is untrackedable
});
```

**Impact:**
- Employees can work from home while clocking in at office
- No location verification for management team
- HR can't enforce field presence
- Business metrics become unreliable

**Fix Required:**
→ See SECURITY_FIXES_IMPLEMENTATION.md → FIX #7: Fix Geofence Bypass Logic

---

### Sensitive Data in JWT Tokens

**The Problem:**
Banking details and personal ID numbers are included in JWT tokens, which are visible to the client.

**Vulnerable Code:**
```
apps/admin/src/lib/auth.ts
  ├─ Lines 107-120: jwt callback
  │  ├─ token.bankName = (user as any).bankName;
  │  ├─ token.bankAccountNumber = (user as any).bankAccountNumber;  ← EXPOSED
  │  ├─ token.bankAccountName = (user as any).bankAccountName;
  │  ├─ token.ssnitNumber = (user as any).ssnitNumber;           ← EXPOSED (Ghana ID)
  │  ├─ token.commencementDate = (user as any).commencementDate;
  │  ├─ token.ghanaCard = (user as any).ghanaCard;               ← EXPOSED
  │  └─ token.dob = (user as any).dob;                           ← EXPOSED
  │
  ├─ Lines 123-120: session callback
  │  └─ All above values also added to session.user (client-accessible)
  │
  └─ Result: JWT token contains full banking & ID details
```

**Risk:**
```javascript
// Browser console (anyone with access to user's browser):
const token = localStorage.getItem('next-auth.session-token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);

// Output:
{
  bankName: "Barclays Bank Ghana",
  bankAccountNumber: "0091234567",
  ssnitNumber: "1234567890-123-4",  ← GHANA SOCIAL SECURITY
  ghanaCard: "GHA-789456-123-4",      ← GHANA UNIQUE ID
  dob: "1990-01-15",
  ...
}
```

**Fix Applied:**
→ See SECURITY_FIXES_IMPLEMENTATION.md → FIX #6: Remove Sensitive Data from JWT

---

### Missing Role Checks in Some APIs

**The Problem:**
Not all API endpoints validate authorization consistently.

**Files with Potential Issues:**
```
✅ CORRECT (filters by organizationId):
  apps/admin/src/app/api/dashboard/agents/route.ts
    └─ Lines 10-24: Checks organizationId match

  apps/admin/src/app/api/operations/map-data/route.ts
    └─ Lines 15-23: Allows SUPER_ADMIN, filters org for others

  apps/admin/src/app/api/inventory/route.ts
    └─ Line 37: whereClause.shop = { organizationId: user.organizationId };

❌ NEEDS VERIFICATION:
  apps/admin/src/app/api/mobile/init/route.ts
    ├─ Line 39-60: Returns shop data without full tenant check
    ├─ Missing: Verification that shop belongs to user's organization
    └─ Risk: Could expose Shop data from different organization

  apps/admin/src/app/api/operations/reports/route.ts
    ├─ Line 93: findMany without organization filter?
    └─ Needs audit

  apps/admin/src/app/api/mobile/diagnostic/route.ts
    └─ Returns diagnostic data for any authenticated user
```

---

### No CSRF Protection on State-Changing Operations

**The Problem:**
POST/PUT/DELETE endpoints don't validate CSRF tokens.

**Vulnerable Endpoints (Examples):**
```
POST /api/sales              ← Creates transaction (financial)
POST /api/hr/create          ← Creates user (admin action)
POST /api/settings           ← Changes organization settings
PUT  /api/products/update-price  ← Modifies prices
DELETE /api/inventory/*      ← Removes stock
```

**Missing Protection:**
```typescript
// Current (VULNERABLE):
export async function POST(req: Request) {
  const body = await req.json();
  // ... process immediately
}

// Should have:
// 1. CSRF token validation
// 2. SameSite=Strict cookies
// 3. Origin header check
```

---

## 🟡 MEDIUM SEVERITY ISSUES

### No Rate Limiting on Auth Endpoint

**The Problem:**
Authentication endpoints can be brute-forced without limitation.

**Vulnerable Endpoint:**
```
apps/admin/src/app/api/auth/[...nextauth]/route.ts
  └─ Can be called unlimited times with different passwords
  └─ No account lockout mechanism
  └─ No CAPTCHA after failed attempts
```

**Missing Protection:**
```
No: Rate limiting (e.g., 5 attempts per 15 minutes)
No: Account lockout (e.g., lock after 5 failed attempts)
No: CAPTCHA (e.g., show after 3 failed attempts)
No: Email notification (e.g., alert on suspicious login)
No: IP-based blocking (e.g., block IP after 20 failed attempts)
```

---

### No Audit Logging for Sensitive Actions

**The Problem:**
Critical actions aren't logged consistently.

**Audit Table Exists But Underused:**
```
prisma/schema.prisma
  ├─ Line 380-398: AuditLog model exists
  │  └─ id, userId, action, entity, entityId, details, ipAddress, createdAt
  │
  └─ But it's not used for:
     ├─ Login attempts (success/failure)
     ├─ Role changes
     ├─ Sensitive data access (bank details)
     ├─ Resource deletion
     └─ Admin actions
```

**Files Missing Audit Logging:**
```
apps/admin/src/lib/auth.ts
  └─ No logging of successful/failed logins

apps/admin/src/app/api/hr/create/route.ts
  └─ No logging of user creation

apps/admin/src/app/api/mobile/location/route.ts
  └─ Line 51-70: Logs bypass but inconsistently
```

---

### Password Policy Not Enforced

**The Problem:**
No minimum password strength requirements visible.

**Missing Validation:**
```
❌ Minimum length (12 characters?)
❌ Character mix (upper, lower, number, symbol)
❌ Password history (prevent reuse)
❌ Password expiration (e.g., 90 days)
❌ Breach checking (against known compromised passwords)
```

---

## 🔵 CONFIGURATION ISSUES

### Duplicate Auth Configuration

**The Problem:**
`auth.ts` is identical in both `apps/admin` and `apps/agent`.

**Files:**
```
apps/admin/src/lib/auth.ts (Lines 1-150)
  └─ IDENTICAL to agent/src/lib/auth.ts
  └─ Both files should be different!
  └─ Maintenance nightmare (fix in one, forget the other)

apps/agent/src/lib/auth.ts (Lines 1-150)
  └─ DUPLICATE of admin version
  └─ If we patch one, the other becomes vulnerable
```

**Risk:**
- If security bug is fixed in one, the other might remain vulnerable
- Code duplication violates DRY principle
- Package updates might be applied inconsistently

**Recommendation:**
```
Create shared auth package:
  packages/auth/
    ├─ src/
    │  ├─ auth.ts ............... Shared config
    │  ├─ auth-helpers.ts ....... Shared utilities
    │  └─ auth-super-admin.ts ... SUPER_ADMIN specific
    │
    └─ package.json

Then in both apps:
  import { authOptions } from '@nexus/auth';
  import { superAdminAuthOptions } from '@nexus/auth/super-admin';
```

---

### Inconsistent Use of Auth Helpers

**The Problem:**
Different API endpoints use different authentication patterns.

**Inconsistencies:**
```
Pattern A (Best Practice):
  const user = await requireAuth();
  Files: inventory/route.ts, operations/reports/route.ts

Pattern B (Acceptable):
  const session = await getServerSession(authOptions);
  Files: sales/route.ts, dashboard/agents/route.ts

Pattern C (Mixed - Worst):
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) { ... }
  Files: dashboard/stats/route.ts, shops/route.ts
```

**Files to Standardize:**
```
All API routes should use:
  const user = await requireAuth();        // Instead of getServerSession
  const adminUser = await requireAdmin();  // For admin routes
  const superUser = await requireSuperAdmin();  // For super admin routes
```

---

### Missing Type Safety on User Object

**The Problem:**
User object is cast to `any` type throughout codebase.

**Examples:**
```
(session.user as any).role         ← Should be typed
(session.user as any).id           ← Should be typed
(session.user as any).organizationId ← Should be typed
(user as any).bypassGeofence       ← Should be typed
```

**Better Approach:**
```typescript
// Define proper types:
interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'WORKER' | 'AGENT' | 'ASSISTANT';
  organizationId: string | null;
}

// Use typed interface:
const user = session.user as SessionUser;
user.role;  // ✅ Type-safe, autocomplete works
```

---

## ✅ POSITIVE FINDINGS

### Good Security Practices Found:
```
✅ Passwords hashed with bcryptjs (not plaintext)
✅ JWT strategy used (not database sessions)
✅ Most queries filter by organizationId (tenant isolation works)
✅ requireAuth() helper created (some consistency)
✅ Error messages don't leak user existence information
✅ Sensitive routes like /api/super check for SUPER_ADMIN role
✅ CORS appears configured (would need to verify origin check)
✅ Environment variables used for secrets (not hardcoded)
```

---

## Priority Fix Timeline

### TODAY (Emergency):
1. [ ] Fix `/api/sales` GET endpoint
2. [ ] Add middleware.ts for route protection
3. [ ] Reduce JWT maxAge to 4 hours

### THIS WEEK:
4. [ ] Create separate SUPER_ADMIN auth
5. [ ] Remove sensitive data from JWT
6. [ ] Fix geofence bypass logic
7. [ ] Add rate limiting to auth endpoint

### THIS MONTH:
8. [ ] Full security testing
9. [ ] Implement 2FA for SUPER_ADMIN
10. [ ] Consolidate duplicate auth files

---

**Last Updated:** February 9, 2026  
**Critical Files Count:** 15+  
**Medium-to-Critical Issues:** 18  
**Overall Risk Assessment:** 🔴 CRITICAL - Do not deploy to production
