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
"[project]/apps/admin/src/app/api/analytics/dashboard/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/admin/src/lib/prisma.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$2d$auth$40$4$2e$24$2e$13_next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4_$5f$react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next-auth@4.24.13_next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4__react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next-auth/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/admin/src/lib/auth.ts [app-route] (ecmascript)");
;
;
;
;
async function GET() {
    try {
        const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$2d$auth$40$4$2e$24$2e$13_next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4_$5f$react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getServerSession"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["authOptions"]);
        const userId = session?.user?.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // 1. KPI: Total Revenue (Today)
        const revenueAgg = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].sale.aggregate({
            where: {
                createdAt: {
                    gte: today
                }
            },
            _sum: {
                totalAmount: true
            } // FIXED: Changed 'total' to 'totalAmount'
        });
        // 2. KPI: Active Staff
        const activeStaffCount = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].attendance.count({
            where: {
                date: {
                    gte: today
                },
                checkOut: null
            }
        });
        // 3. KPI: Inventory Value (Buying Price * Stock)
        // ⚡️ OPTIMIZED: Use Raw SQL for speed instead of loading all rows
        const inventoryValRaw = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].$queryRaw`
      SELECT SUM("buyingPrice" * "quantity") as total_value FROM "Product"
    `;
        const inventoryValue = inventoryValRaw[0]?.total_value || 0;
        // 4. CHART DATA: Sales Velocity (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentSales = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].sale.groupBy({
            by: [
                'createdAt'
            ],
            where: {
                createdAt: {
                    gte: sevenDaysAgo
                }
            },
            _sum: {
                totalAmount: true
            }
        });
        // Format chart data (Group by Day Name)
        const chartMap = new Map();
        const days = [
            'Sun',
            'Mon',
            'Tue',
            'Wed',
            'Thu',
            'Fri',
            'Sat'
        ];
        recentSales.forEach((entry)=>{
            const dayName = days[new Date(entry.createdAt).getDay()];
            const current = chartMap.get(dayName) || 0;
            chartMap.set(dayName, current + (entry._sum.totalAmount || 0));
        });
        const chartData = Array.from(chartMap).map(([name, sales])=>({
                name,
                sales
            }));
        // 5. Shop Performance Leaderboard
        const shopPerformance = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].shop.findMany({
            take: 5,
            include: {
                sales: {
                    where: {
                        createdAt: {
                            gte: today
                        }
                    },
                    select: {
                        totalAmount: true
                    }
                }
            }
        });
        const formattedShopPerf = shopPerformance.map((shop)=>({
                name: shop.name,
                revenue: shop.sales.reduce((acc, sale)=>acc + sale.totalAmount, 0)
            })).sort((a, b)=>b.revenue - a.revenue);
        // 6. 🎯 ADMIN TARGET PERFORMANCE
        let adminTargetData = null;
        if (userId) {
            const activeTarget = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].target.findFirst({
                where: {
                    userId,
                    status: 'ACTIVE',
                    endDate: {
                        gte: new Date()
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            if (activeTarget) {
                // Aggregate Sales within Target Period
                const periodPerformance = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].sale.aggregate({
                    where: {
                        createdAt: {
                            gte: activeTarget.startDate,
                            lte: activeTarget.endDate
                        }
                    },
                    _sum: {
                        totalAmount: true
                    },
                    _count: {
                        id: true // Volume of transactions
                    }
                });
                // Also get total items sold (volume) if needed, but transaction count is often a good proxy. 
                // If "Quantity" means individual items, we need to sum SaleItem.quantity.
                // Let's assume Target Quantity is 'Units Sold'.
                const itemsPerformance = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$admin$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].saleItem.aggregate({
                    where: {
                        sale: {
                            createdAt: {
                                gte: activeTarget.startDate,
                                lte: activeTarget.endDate
                            }
                        }
                    },
                    _sum: {
                        quantity: true
                    }
                });
                adminTargetData = {
                    ...activeTarget,
                    currentRevenue: periodPerformance._sum.totalAmount || 0,
                    currentVolume: itemsPerformance._sum.quantity || 0
                };
            }
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            revenue: revenueAgg._sum.totalAmount || 0,
            activeStaff: activeStaffCount,
            inventoryValue,
            chartData: chartData.length > 0 ? chartData : [
                {
                    name: 'Today',
                    sales: 0
                }
            ],
            shopPerformance: formattedShopPerf,
            adminTarget: adminTargetData
        });
    } catch (error) {
        console.error("❌ DASHBOARD_API_ERROR:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            revenue: 0,
            activeStaff: 0,
            inventoryValue: 0,
            chartData: [],
            shopPerformance: []
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__2687b7b0._.js.map