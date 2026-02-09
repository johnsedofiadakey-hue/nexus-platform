# 🛠️ SECURITY FIXES IMPLEMENTATION GUIDE

## PHASE 1: EMERGENCY FIXES (Start Today)

### FIX #1: Add Authentication & Tenant Isolation to /api/sales

**Current Code (VULNERABLE):**
```typescript
// apps/admin/src/app/api/sales/route.ts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  
  if (!userId) {
    return NextResponse.json([]);
  }
  
  const sales = await prisma.sale.findMany({
    where: { userId },  // ❌ NO AUTH, NO TENANT CHECK
    ...
  });
  return NextResponse.json(sales);
}
```

**Fixed Code:**
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth-helpers";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json([]);
    }

    // ✅ AUTHENTICATION CHECK
    const user = await requireAuth();
    
    // ✅ AUTHORIZATION CHECK
    // Users can only see their own sales, or admins can see anyone's
    if (user.id !== userId && !['ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: "Unauthorized: Cannot view other user's sales" },
        { status: 403 }
      );
    }

    // ✅ TENANT ISOLATION - Verify both users in same organization
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.organizationId !== targetUser.organizationId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: "Unauthorized: Different organization" },
        { status: 403 }
      );
    }

    const sales = await prisma.sale.findMany({
      where: { 
        userId,
        user: {
          organizationId: user.role === 'SUPER_ADMIN' ? undefined : user.organizationId
        }
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        totalAmount: true,
        amountPaid: true,
        paymentMethod: true,
        status: true,
        createdAt: true,
        shop: { select: { name: true } },
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            product: { select: { name: true } }
          }
        }
      }
    });

    return NextResponse.json(sales);
  } catch (error: any) {
    console.error("❌ SALES_API_ERROR:", error);
    
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

---

### FIX #2: Create Middleware for Route Protection

**File: `apps/admin/src/middleware.ts`** (Create new file)

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that require specific roles
const PROTECTED_ROUTES = {
  '/dashboard': ['ADMIN', 'MANAGER', 'SUPER_ADMIN'],
  '/staff': ['ADMIN', 'MANAGER', 'SUPER_ADMIN'],
  '/super-user': ['SUPER_ADMIN'],
  '/api/super': ['SUPER_ADMIN'],
};

const AGENT_ONLY_ROUTES = {
  '/mobilepos': ['WORKER', 'AGENT', 'ASSISTANT'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Get the token from the request
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  // 2. Check if user is authenticated
  if (!token) {
    // Allow access to signin page and public routes
    if (pathname === '/auth/signin' || pathname.startsWith('/_next')) {
      return NextResponse.next();
    }
    
    // Redirect to signin if accessing protected route
    return NextResponse.redirect(
      new URL(`/auth/signin?callbackUrl=${pathname}`, request.url)
    );
  }

  // 3. Check protected routes
  for (const [route, allowedRoles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(route)) {
      const userRole = token.role as string;
      
      if (!allowedRoles.includes(userRole)) {
        return NextResponse.redirect(new URL('/auth/error?error=unauthorized', request.url));
      }
    }
  }

  // 4. Check agent-only routes
  for (const [route, allowedRoles] of Object.entries(AGENT_ONLY_ROUTES)) {
    if (pathname.startsWith(route)) {
      const userRole = token.role as string;
      
      if (!allowedRoles.includes(userRole)) {
        return NextResponse.redirect(new URL('/auth/error?error=unauthorized', request.url));
      }
    }
  }

  // 5. Allow all other requests
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/public|_next/static|favicon.ico).*)',
  ],
};
```

**File: `apps/agent/src/middleware.ts`** (Create the same for agent app):

```typescript
// Same as above but with AGENT_ONLY_ROUTES for /mobilepos
// See above pattern
```

---

### FIX #3: Create Separate SUPER_ADMIN Authentication

**File: `apps/admin/src/lib/auth-super-admin.ts`** (Create new file)

```typescript
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

/**
 * SUPER_ADMIN ONLY Authentication
 * Enhanced security with additional checks
 */
export const superAdminAuthOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  trustHost: true,

  cookies: {
    sessionToken: {
      name: 'nexus-super-admin-token',  // Different cookie name
      options: {
        httpOnly: true,
        sameSite: 'strict',  // ✅ Stricter than 'lax'
        secure: true,  // ✅ HTTPS only
        path: '/',
        maxAge: 4 * 60 * 60,  // ✅ 4 hours only (not 30 days)
      }
    }
  },

  session: { 
    strategy: "jwt",
    maxAge: 4 * 60 * 60,  // ✅ 4 hours
  },

  secret: process.env.NEXTAUTH_SUPER_ADMIN_SECRET,

  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        // ✅ Additional field for SUPER_ADMIN verification
        masterPin: { label: "Master PIN", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          // 1. Find user
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() }
          });

          if (!user) return null;

          // ✅ VERIFY SUPER_ADMIN ROLE
          if (user.role !== 'SUPER_ADMIN') {
            console.warn(`Non-SUPER_ADMIN login attempt for SUPER_ADMIN portal: ${credentials.email}`);
            return null;
          }

          // 2. Verify password
          const isValid = await compare(credentials.password, user.password);
          if (!isValid) return null;

          // ✅ VERIFY ACCOUNT STATUS
          if (user.status !== 'ACTIVE') {
            console.warn(`Disabled account login attempt: ${credentials.email}`);
            return null;
          }

          // ✅ Log successful SUPER_ADMIN login
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: 'SUPER_ADMIN_LOGIN',
              entity: 'User',
              entityId: user.id,
              ipAddress: credentials.email,  // TODO: Get actual IP
                details: JSON.stringify({ 
                email: user.email,
                timestamp: new Date().toISOString()
              })
            }
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: null,  // SUPER_ADMIN has no org
          };
        } catch (error) {
          console.error("SUPER_ADMIN auth error:", error);
          return null;
        }
      }
    })
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        // ❌ DO NOT include sensitive data in JWT
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    }
  },

  pages: {
    signIn: '/auth/super-admin/signin',
    error: '/auth/super-admin/signin',
  },

  useSecureCookies: true,  // Always true for SUPER_ADMIN
};
```

**File: `apps/admin/src/app/api/auth/super-admin/[...nextauth]/route.ts`** (Create new):

```typescript
import NextAuth from "next-auth";
import { superAdminAuthOptions } from "@/lib/auth-super-admin";

const handler = NextAuth(superAdminAuthOptions);

export { handler as GET, handler as POST };
```

---

### FIX #4: Reduce JWT Session Timeout

**Update in `apps/admin/src/lib/auth.ts`:**

```typescript
session: { 
  strategy: "jwt",
  maxAge: 4 * 60 * 60,  // ✅ CHANGED FROM 30 days to 4 hours
},

cookies: {
  sessionToken: {
    name: `next-auth.session-token`,
    options: {
      httpOnly: true,
      sameSite: 'strict',  // ✅ CHANGED FROM 'lax' to 'strict'
      path: '/',
      secure: process.env.NODE_ENV === 'production'
    }
  }
},
```

---

### FIX #5: Update Auth Helpers to be More Strict

**File: `apps/admin/src/lib/auth-helpers.ts`** Replace entire file:

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export interface AuthenticatedUser {
    id: string;
    email: string;
    name: string | null;
    role: string;
    organizationId: string | null;
}

/**
 * Get authenticated user from session
 * Returns null if not authenticated
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return null;
    }

    return {
        id: (session.user as any).id || "",
        email: session.user.email,
        name: session.user.name || null,
        role: (session.user as any).role || "WORKER",
        organizationId: (session.user as any).organizationId || null,
    };
}

/**
 * Require authentication - throws 401 if not authenticated
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
    const user = await getAuthenticatedUser();

    if (!user) {
        throw new Error("UNAUTHORIZED");
    }

    return user;
}

/**
 * Require specific role(s) - throws 403 if user doesn't have required role
 */
export async function requireRole(allowedRoles: string[]): Promise<AuthenticatedUser> {
    const user = await requireAuth();

    if (!allowedRoles.includes(user.role)) {
        throw new Error("FORBIDDEN");
    }

    return user;
}

/**
 * Require SUPER_ADMIN role specifically
 */
export async function requireSuperAdmin(): Promise<AuthenticatedUser> {
    return requireRole(['SUPER_ADMIN']);
}

/**
 * Require ADMIN or MANAGER role
 */
export async function requireAdmin(): Promise<AuthenticatedUser> {
    return requireRole(['ADMIN', 'MANAGER', 'SUPER_ADMIN']);
}

/**
 * Get organization ID with automatic filtering
 */
export async function getOrganizationId(allowSuperAdmin = false): Promise<string> {
    const user = await requireAuth();

    if (allowSuperAdmin && user.role === "SUPER_ADMIN") {
        return ""; // Empty string = all organizations
    }

    if (!user.organizationId) {
        throw new Error("NO_ORGANIZATION");
    }

    return user.organizationId;
}

/**
 * Verify user belongs to organization
 */
export async function requireOrganization(orgId: string): Promise<AuthenticatedUser> {
    const user = await requireAuth();

    if (user.role === 'SUPER_ADMIN') {
        return user;  // Super admin bypasses org checks
    }

    if (user.organizationId !== orgId) {
        throw new Error("FORBIDDEN");
    }

    return user;
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: any): NextResponse {
    console.error("API Error:", error);

    if (error.message === "UNAUTHORIZED") {
        return NextResponse.json(
            { error: "Unauthorized - Please sign in" },
            { status: 401 }
        );
    }

    if (error.message === "FORBIDDEN") {
        return NextResponse.json(
            { error: "Forbidden - Insufficient permissions" },
            { status: 403 }
        );
    }

    if (error.message === "NO_ORGANIZATION") {
        return NextResponse.json(
            { error: "Organization not found" },
            { status: 400 }
        );
    }

    return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
    );
}
```

---

## PHASE 2: THIS WEEK FIXES

### FIX #6: Remove Sensitive Data from JWT

**Update `apps/admin/src/lib/auth.ts` (lines 107-120):**

```typescript
// ❌ REMOVE these lines:
// token.bankName = (user as any).bankName;
// token.bankAccountNumber = (user as any).bankAccountNumber;
// token.bankAccountName = (user as any).bankAccountName;
// token.ssnitNumber = (user as any).ssnitNumber;
// token.commencementDate = (user as any).commencementDate;
// token.ghanaCard = (user as any).ghanaCard;
// token.dob = (user as any).dob;

// ✅ Only keep these:
export const authOptions: NextAuthOptions = {
  // ...
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.organizationId = (user as any).organizationId;
        // ✅ NO sensitive data in JWT
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).organizationId = token.organizationId;
        // ✅ NO sensitive data added to session
      }
      return session;
    }
  },
};
```

---

### FIX #7: Fix Geofence Bypass Logic

**File: `apps/admin/src/app/api/mobile/location/route.ts`**

```typescript
// ❌ OLD - Allows any admin to bypass
const isInside = distance <= effectiveRadius || agent.bypassGeofence;

// ✅ NEW - Only SUPER_ADMIN can bypass, and only with explicit reason
if (!isInside && !agent.bypassGeofence) {  // Changed logic
  await prisma.disciplinaryRecord.create({
    data: {
      userId: userId,
      type: 'GEOFENCE_BREACH',
      severity: distance > (effectiveRadius + 500) ? 'CRITICAL' : 'WARNING',
      description: `Geofence breach detected...`,
      actionTaken: 'SYSTEM_AUTO_LOG'
    }
  });
}

// Optional: Log bypass usage for audit
if (agent.bypassGeofence && (authenticatedUser.role === 'SUPER_ADMIN' || authenticatedUser.role === 'ADMIN')) {
  await prisma.auditLog.create({
    data: {
      userId: authenticatedUser.id,
      action: 'GEOFENCE_BYPASS_USED',
      entity: 'User',
      entityId: userId,
      details: JSON.stringify({
        actualDistance: distance,
        allowedDistance: effectiveRadius,
        timestamp: new Date().toISOString()
      })
    }
  });
}
```

---

### FIX #8: Add Audit Logging for Sensitive Actions

**Create: `apps/admin/src/lib/audit-logger.ts`**

```typescript
import { prisma } from "@/lib/prisma";

export interface AuditLogEntry {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  shopId?: string;
}

export async function createAuditLog(entry: AuditLogEntry) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: entry.userId },
      select: { name: true, role: true, organizationId: true }
    });

    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        details: entry.details ? JSON.stringify(entry.details) : null,
        ipAddress: entry.ipAddress,
        shopId: entry.shopId,
      }
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Don't throw - logging failure shouldn't break main function
  }
}

// Specific audit log functions
export async function auditLogin(userId: string, email: string, role: string, ipAddress?: string) {
  await createAuditLog({
    userId,
    action: 'USER_LOGIN',
    entity: 'User',
    entityId: userId,
    details: { email, role },
    ipAddress
  });
}

export async function auditRoleChange(userId: string, targetUserId: string, oldRole: string, newRole: string) {
  await createAuditLog({
    userId,
    action: 'ROLE_CHANGED',
    entity: 'User',
    entityId: targetUserId,
    details: { oldRole, newRole, timestamp: new Date() }
  });
}

export async function auditDataAccess(userId: string, entityType: string, entityId: string, action: string) {
  await createAuditLog({
    userId,
    action: `${entityType.toUpperCase()}_ACCESSED`,
    entity: entityType,
    entityId: entityId,
    details: { accessType: action }
  });
}
```

---

## TESTING CHECKLIST

```bash
# Test 1: Sales endpoint now requires auth
curl /api/sales?userId=<id>
# Expected: 401 Unauthorized ✅

# Test 2: Authenticated user can see own sales
curl -H "Authorization: Bearer <token>" /api/sales?userId=$MY_USER_ID
# Expected: 200 OK with sales data ✅

# Test 3: User cannot see other user's sales
curl -H "Authorization: Bearer <token-user-a>" /api/sales?userId=user-b-id
# Expected: 403 Forbidden ✅

# Test 4: Middleware blocks unauthenticated /dashboard
curl /dashboard
# Expected: Redirect to /auth/signin ✅

# Test 5: WORKER role cannot access /super-user
# Login as WORKER
curl /super-user
# Expected: Redirect or 403 ✅

# Test 6: Verify JWT doesn't contain bank details
# Login and inspect JWT at jwt.io
# Should NOT contain: bankName, accountNumber, ssnitNumber, ghanaCard
# Expected: Clean JWT ✅
```

---

## DEPLOYMENT NOTES

1. ✅ Test PHASE 1 fixes locally first
2. ✅ Backup database before deploying
3. ✅ Deploy middleware.ts changes (no data impact)
4. ✅ Deploy auth fixes (no data impact)
5. ✅ Test with staging environment
6. ✅ Monitor logs for auth errors after deploy
7. ✅ Notify users if password policy changes
8. ✅ Plan communication for new SUPER_ADMIN login URL

---

**Next: Implement these fixes and re-run audit**
