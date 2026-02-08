module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/apps/admin/src/lib/prisma.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "prisma",
    ()=>prisma
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/@prisma/client)");
;
/**
 * 🛡️ SECURE PRISMA CLIENT CONFIGURATION
 * 
 * Database: Supabase PostgreSQL (Transaction Pooler)
 * Connection: Uses environment variables for security
 * Mode: Transaction pooling (pgbouncer=true required)
 */ const globalForPrisma = /*TURBOPACK member replacement*/ __turbopack_context__.g;
function getPrismaClient() {
    if (globalForPrisma.prisma) {
        return globalForPrisma.prisma;
    }
    // Build time: return a dummy client that will fail at runtime if used
    if (!process.env.DATABASE_URL) {
        // During build, create a minimal client that won't actually connect
        const client = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]({
            log: []
        });
        if ("TURBOPACK compile-time truthy", 1) {
            globalForPrisma.prisma = client;
        }
        return client;
    }
    // Runtime: create properly configured client
    const baseUrl = process.env.DATABASE_URL;
    const connectionUrl = baseUrl.includes("?") ? `${baseUrl}&pgbouncer=true&connection_limit=1` : `${baseUrl}?pgbouncer=true&connection_limit=1`;
    const client = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]({
        datasources: {
            db: {
                url: connectionUrl
            }
        },
        log: ("TURBOPACK compile-time truthy", 1) ? [
            "error",
            "warn"
        ] : "TURBOPACK unreachable"
    });
    if ("TURBOPACK compile-time truthy", 1) {
        globalForPrisma.prisma = client;
    }
    return client;
}
const prisma = getPrismaClient();
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/assert [external] (assert, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("assert", () => require("assert"));

module.exports = mod;
}),
"[externals]/querystring [external] (querystring, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("querystring", () => require("querystring"));

module.exports = mod;
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}),
"[project]/apps/admin/src/lib/auth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "authOptions",
    ()=>authOptions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$2d$auth$40$4$2e$24$2e$13_next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4_$5f$react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2d$auth$2f$providers$2f$credentials$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next-auth@4.24.13_next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4__react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next-auth/providers/credentials.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/admin/src/lib/prisma.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$bcryptjs$40$2$2e$4$2e$3$2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/bcryptjs@2.4.3/node_modules/bcryptjs/index.js [app-route] (ecmascript)");
;
;
;
// Check for required environment variables
if (!process.env.NEXTAUTH_SECRET) {
    console.error("❌ CRITICAL: NEXTAUTH_SECRET is not set!");
    console.error("Generate one with: openssl rand -base64 32");
}
if (!process.env.DATABASE_URL) {
    console.error("❌ CRITICAL: DATABASE_URL is not set!");
}
// 🚨 CRITICAL: Check NEXTAUTH_URL for deployment
if (!process.env.NEXTAUTH_URL) {
    console.error("⚠️  WARNING: NEXTAUTH_URL is not set!");
    console.error("This can cause refresh loops in production.");
    console.error("Set it to your deployment URL: https://your-app.vercel.app");
} else if (process.env.NEXTAUTH_URL.includes('localhost') && ("TURBOPACK compile-time value", "development") === 'production') //TURBOPACK unreachable
;
const authOptions = {
    debug: ("TURBOPACK compile-time value", "development") === 'development',
    // 🔒 TRUST HOST for Vercel/production deployments
    // This prevents callback URL mismatches
    trustHost: true,
    // 🍪 FORCE COOKIES TO STICK (Critical for localhost)
    cookies: {
        sessionToken: {
            name: `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: ("TURBOPACK compile-time value", "development") === 'production'
            }
        }
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60
    },
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$2d$auth$40$4$2e$24$2e$13_next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4_$5f$react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2d$auth$2f$providers$2f$credentials$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])({
            name: "Credentials",
            credentials: {
                email: {
                    label: "Email",
                    type: "email"
                },
                password: {
                    label: "Password",
                    type: "password"
                }
            },
            async authorize (credentials) {
                if (!credentials?.email || !credentials?.password) return null;
                try {
                    // 1. Find User
                    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
                        where: {
                            email: credentials.email.toLowerCase()
                        }
                    });
                    if (!user) {
                        console.log("User not found:", credentials.email);
                        return null;
                    }
                    // 2. 🛡️ SECURE PASSWORD CHECK (Bcrypt)
                    const isValid = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$bcryptjs$40$2$2e$4$2e$3$2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["compare"])(credentials.password, user.password);
                    if (!isValid) {
                        console.log("Invalid password for user:", credentials.email);
                        return null;
                    }
                    console.log("✅ User authenticated:", user.email);
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        organizationId: user.organizationId,
                        bankName: user.bankName,
                        bankAccountNumber: user.bankAccountNumber,
                        bankAccountName: user.bankAccountName,
                        ssnitNumber: user.ssnitNumber,
                        commencementDate: user.commencementDate,
                        ghanaCard: user.ghanaCard,
                        dob: user.dob
                    };
                } catch (error) {
                    console.error("❌ Auth error:", error);
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async jwt ({ token, user }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
                token.organizationId = user.organizationId;
                token.bankName = user.bankName;
                token.bankAccountNumber = user.bankAccountNumber;
                token.bankAccountName = user.bankAccountName;
                token.ssnitNumber = user.ssnitNumber;
                token.commencementDate = user.commencementDate;
                token.ghanaCard = user.ghanaCard;
                token.dob = user.dob;
            }
            return token;
        },
        async session ({ session, token }) {
            if (session.user) {
                session.user.role = token.role;
                session.user.id = token.id;
                session.user.organizationId = token.organizationId;
                session.user.bankName = token.bankName;
                session.user.bankAccountNumber = token.bankAccountNumber;
                session.user.bankAccountName = token.bankAccountName;
                session.user.ssnitNumber = token.ssnitNumber;
                session.user.commencementDate = token.commencementDate;
                session.user.ghanaCard = token.ghanaCard;
                session.user.dob = token.dob;
            }
            return session;
        }
    },
    // 🚪 CUSTOM PAGES
    pages: {
        signIn: '/auth/signin',
        error: '/auth/signin'
    },
    // Add useSecureCookies for production
    useSecureCookies: ("TURBOPACK compile-time value", "development") === 'production'
};
}),
"[project]/apps/admin/src/lib/activity-logger.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getClientIp",
    ()=>getClientIp,
    "getUserAgent",
    ()=>getUserAgent,
    "logActivity",
    ()=>logActivity,
    "logTargetActivity",
    ()=>logTargetActivity
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/admin/src/lib/prisma.ts [app-route] (ecmascript)");
;
async function logActivity(params) {
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].activityLog.create({
            data: {
                userId: params.userId,
                userName: params.userName,
                userRole: params.userRole,
                action: params.action,
                entity: params.entity,
                entityId: params.entityId,
                description: params.description,
                metadata: params.metadata || {},
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
                shopId: params.shopId,
                shopName: params.shopName
            }
        });
    } catch (error) {
        console.error("❌ Activity Logger Error:", error);
    // Don't throw - logging failures shouldn't break the main operation
    }
}
async function logTargetActivity(targetId, userId, action, previousValue, newValue, progress, achievedValue, achievedQuantity, notes) {
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].targetHistory.create({
            data: {
                targetId,
                userId,
                action,
                previousValue: previousValue || {},
                newValue: newValue || {},
                progress: progress || 0,
                achievedValue: achievedValue || 0,
                achievedQuantity: achievedQuantity || 0,
                notes
            }
        });
    } catch (error) {
        console.error("❌ Target History Logger Error:", error);
    }
}
function getClientIp(request) {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    return realIp || undefined;
}
function getUserAgent(request) {
    return request.headers.get("user-agent") || undefined;
}
}),
"[project]/apps/admin/src/app/api/hr/member/[id]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DELETE",
    ()=>DELETE,
    "GET",
    ()=>GET,
    "PATCH",
    ()=>PATCH
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/admin/src/lib/prisma.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$2d$auth$40$4$2e$24$2e$13_next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4_$5f$react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next-auth@4.24.13_next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4__react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next-auth/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/admin/src/lib/auth.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$bcryptjs$40$2$2e$4$2e$3$2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/bcryptjs@2.4.3/node_modules/bcryptjs/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$activity$2d$logger$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/admin/src/lib/activity-logger.ts [app-route] (ecmascript)");
;
;
;
;
;
;
async function GET(req, props) {
    try {
        const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$2d$auth$40$4$2e$24$2e$13_next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4_$5f$react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getServerSession"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["authOptions"]);
        if (!session) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Unauthorized"
        }, {
            status: 401
        });
        const params = await props.params;
        const { id } = params;
        if (!id) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Missing ID"
        }, {
            status: 400
        });
        console.log(`Syncing records for Operative: ${id}`);
        const whereClause = {
            id
        };
        // 🔐 Tenant Isolation (Bypass for Super Admin)
        if (session.user.role !== 'SUPER_ADMIN') {
            whereClause.organizationId = session.user.organizationId;
        }
        const { searchParams } = new URL(req.url);
        const light = searchParams.get('light') === 'true';
        const include = {
            shop: {
                select: {
                    id: true,
                    name: true,
                    location: true,
                    latitude: true,
                    longitude: true,
                    radius: true
                }
            },
            targets: {
                where: {
                    status: 'ACTIVE'
                },
                orderBy: {
                    endDate: 'desc'
                }
            }
        };
        if (!light) {
            include.sales = {
                take: 20,
                orderBy: {
                    createdAt: 'desc'
                }
            };
            include.dailyReports = {
                take: 50,
                orderBy: {
                    createdAt: 'desc'
                }
            };
            include.attendance = {
                take: 30,
                orderBy: {
                    date: 'desc'
                }
            };
            include.leaves = {
                take: 50,
                orderBy: {
                    createdAt: 'desc'
                }
            };
            include.disciplinary = {
                take: 30,
                orderBy: {
                    createdAt: 'desc'
                }
            };
            include.sentMessages = {
                take: 20,
                orderBy: {
                    createdAt: 'desc'
                }
            };
            include.receivedMessages = {
                take: 20,
                orderBy: {
                    createdAt: 'desc'
                }
            };
        } else {
            // Light mode might still need minimal disciplinary for geofence breaches if required by the UI
            include.disciplinary = {
                take: 30,
                orderBy: {
                    createdAt: 'desc'
                }
            };
        }
        // Add query timeout protection
        const queryPromise = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].user.findFirst({
            where: whereClause,
            include
        });
        const timeoutPromise = new Promise((_, reject)=>setTimeout(()=>reject(new Error('Database query timeout')), 10000));
        const user = await Promise.race([
            queryPromise,
            timeoutPromise
        ]);
        if (!user) {
            console.log(`Member not found with ID: ${id}`);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Member not found",
                details: `No agent found with ID: ${id}. Check if this person exists in your organization.`
            }, {
                status: 404
            });
        }
        const disciplinaryLog = user.disciplinary || [];
        // Combine messages into a unified timeline
        const chatHistory = [
            ...user.sentMessages || [],
            ...user.receivedMessages || []
        ].sort((a, b)=>new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        // 📈 GEOSPATIAL ANALYSIS: Calculate Breaches for the Performance Chart
        const geofenceStats = disciplinaryLog.filter((log)=>log.type === 'GEOFENCE_BREACH').reduce((acc, log)=>{
            const logDate = log.createdAt || new Date();
            const day = new Date(logDate).toLocaleDateString('en-US', {
                weekday: 'short'
            });
            const existing = acc.find((a)=>a.name === day);
            if (existing) {
                existing.breaches += 1;
            } else {
                acc.push({
                    name: day,
                    breaches: 1
                });
            }
            return acc;
        }, []);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ...user,
            disciplinaryLog,
            messages: chatHistory,
            geofenceStats,
            viewerId: session.user.id,
            targets: user.targets || []
        });
    } catch (error) {
        console.error("System Sync Error:", error);
        console.error("Error Details:", {
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack?.split('\n').slice(0, 3).join('\n')
        });
        // � Database Connection Error
        if (error.message?.includes("Can't reach database server") || error.message?.includes("ECONNREFUSED") || error.message?.includes("getaddrinfo") || error.code === 'P1001') {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Database connection failed",
                code: "DB_CONNECTION_ERROR",
                details: "Cannot reach database server. Please verify DATABASE_URL is configured correctly in environment variables.",
                hint: "Check .env file or run: ./setup-nexus.sh"
            }, {
                status: 503
            });
        }
        // 🛡️ Prepared Statement Guard
        if (error.message?.includes("prepared statement")) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Database Connection Refused. System cache desync.",
                code: "PG_POOLER_RESET",
                details: error.message
            }, {
                status: 503
            });
        }
        // 🔍 Schema Migration Required
        if (error.code === 'P2021' || error.message?.includes('does not exist')) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Database schema out of sync. Migration required.",
                code: "SCHEMA_MISMATCH",
                details: "Run: npx prisma db push",
                hint: error.message
            }, {
                status: 503
            });
        }
        // 🔐 Environment Variable Missing
        if (error.message?.includes("Environment variable") || error.message?.includes("DATABASE_URL")) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Database not configured",
                code: "ENV_MISSING",
                details: "DATABASE_URL environment variable is not set. Please configure your database connection.",
                hint: "Create/edit .env file with DATABASE_URL or run: ./setup-nexus.sh"
            }, {
                status: 503
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Failed to sync records",
            details: error.message,
            code: error.code || "UNKNOWN"
        }, {
            status: 500
        });
    }
}
async function PATCH(req, props) {
    try {
        const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$2d$auth$40$4$2e$24$2e$13_next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4_$5f$react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getServerSession"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["authOptions"]);
        if (!session) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Unauthorized"
        }, {
            status: 401
        });
        const params = await props.params;
        const { id } = params;
        const body = await req.json();
        const { action, ...payload } = body;
        // Verify ownership first
        // Verify ownership first (God Mode for Super Admin)
        const whereCheck = {
            id
        };
        if (session.user.role !== 'SUPER_ADMIN') {
            whereCheck.organizationId = session.user.organizationId;
        }
        const targetUser = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].user.findFirst({
            where: whereCheck
        });
        if (!targetUser) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Access Denied"
        }, {
            status: 403
        });
        if (action === 'UPDATE_PROFILE') {
            const updateData = {
                name: payload.name,
                email: payload.email?.toLowerCase().trim(),
                phone: payload.phone,
                status: payload.status,
                shopId: payload.shopId || null,
                bypassGeofence: payload.bypassGeofence,
                bankName: payload.bankName || null,
                bankAccountNumber: payload.bankAccountNumber || null,
                bankAccountName: payload.bankAccountName || null,
                ssnitNumber: payload.ssnitNumber || null
            };
            // 🏆 Sync Organization if Shop is changed
            if (payload.shopId && payload.shopId !== targetUser.shopId) {
                const newShop = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].shop.findUnique({
                    where: {
                        id: payload.shopId
                    },
                    select: {
                        organizationId: true
                    }
                });
                if (newShop) {
                    updateData.organizationId = newShop.organizationId;
                }
            }
            if (payload.commencementDate) {
                const parsedDate = new Date(payload.commencementDate);
                if (!isNaN(parsedDate.getTime())) {
                    updateData.commencementDate = parsedDate;
                }
            } else {
                updateData.commencementDate = null;
            }
            if (payload.password && payload.password.length > 0) {
                updateData.password = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$bcryptjs$40$2$2e$4$2e$3$2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].hash(payload.password, 12);
            }
            const updated = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].user.update({
                where: {
                    id
                },
                data: updateData
            });
            // 📊 Log Activity
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$activity$2d$logger$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["logActivity"])({
                userId: session.user.id,
                userName: session.user.name || "Unknown",
                userRole: session.user.role || "USER",
                action: "USER_UPDATED",
                entity: "User",
                entityId: id,
                description: `Updated profile for "${updated.name}"`,
                metadata: {
                    targetUserId: id,
                    changes: payload
                },
                ipAddress: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$activity$2d$logger$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getClientIp"])(req),
                userAgent: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$activity$2d$logger$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getUserAgent"])(req)
            });
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true,
                data: updated
            });
        }
        if (action === 'RESET_PASSWORD') {
            // Standalone action (Legacy/Specific)
            if (!payload.password) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Password required"
            }, {
                status: 400
            });
            const hashedPassword = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$bcryptjs$40$2$2e$4$2e$3$2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].hash(payload.password, 12);
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].user.update({
                where: {
                    id
                },
                data: {
                    password: hashedPassword
                }
            });
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true
            });
        }
        if (action === 'MANAGE_LEAVE') {
            await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].leaveRequest.update({
                where: {
                    id: payload.leaveId
                },
                data: {
                    status: payload.status
                }
            });
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Action protocol undefined"
        }, {
            status: 400
        });
    } catch (error) {
        console.error("Administrative Override Failure:", error.message);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Database rejected the override"
        }, {
            status: 500
        });
    }
}
async function DELETE(req, props) {
    try {
        const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$2d$auth$40$4$2e$24$2e$13_next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4_$5f$react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getServerSession"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["authOptions"]);
        if (!session || !session.user || !session.user.organizationId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Unauthorized"
            }, {
                status: 401
            });
        }
        const params = await props.params;
        const { id } = params;
        // Verify ownership first (God Mode for Super Admin)
        const whereCheck = {
            id
        };
        if (session.user.role !== 'SUPER_ADMIN') {
            whereCheck.organizationId = session.user.organizationId;
        }
        const targetUser = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].user.findFirst({
            where: whereCheck
        });
        if (!targetUser) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Access Denied"
        }, {
            status: 403
        });
        // First delete or unassign related records if Prisma relation isn't set to Cascade
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].user.delete({
            where: {
                id
            }
        });
        // 📊 Log Activity
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$activity$2d$logger$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["logActivity"])({
            userId: session.user.id,
            userName: session.user.name || "Unknown",
            userRole: session.user.role || "USER",
            action: "USER_DELETED",
            entity: "User",
            entityId: id,
            description: `Deleted user "${targetUser.name}"`,
            metadata: {
                deletedUserId: id,
                deletedUserName: targetUser.name,
                deletedUserEmail: targetUser.email
            },
            ipAddress: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$activity$2d$logger$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getClientIp"])(req),
            userAgent: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$activity$2d$logger$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getUserAgent"])(req)
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true
        });
    } catch (error) {
        console.error("Purge Error:", error.message);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Failed to remove personnel"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__ced41396._.js.map