module.exports = [
"[project]/apps/agent/src/lib/prisma.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/apps/agent/src/lib/actions/transaction.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"7cc3ec16eba3023776a0853c7f2f780d37ac8f14b7":"processTransaction"},"",""] */ __turbopack_context__.s([
    "processTransaction",
    ()=>processTransaction
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$agent$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/agent/src/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
async function processTransaction(userId, shopId, totalAmount, items, paymentMethod = "CASH") {
    console.log("💳 SERVER_ACTION: Initiating Sale for User:", userId);
    console.log("🏪 Shop ID:", shopId);
    console.log("💰 Total Amount:", totalAmount);
    console.log("📦 Items Count:", items.length);
    try {
        // 1. Validation
        if (!userId || !shopId || items.length === 0) {
            console.error("❌ VALIDATION FAILED:", {
                userId,
                shopId,
                itemsCount: items.length
            });
            return {
                success: false,
                error: "Invalid Data: Missing User, Shop, or Items"
            };
        }
        if (totalAmount <= 0) {
            console.error("❌ INVALID AMOUNT:", totalAmount);
            return {
                success: false,
                error: "Invalid transaction amount"
            };
        }
        // 2. Transaction
        const sale = await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$agent$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
            const saleLines = [];
            // 🚀 OPTIMIZED: Batch fetch all products (eliminates N+1 query problem)
            const productIds = items.map((item)=>item.productId);
            const products = await tx.product.findMany({
                where: {
                    id: {
                        in: productIds
                    }
                },
                select: {
                    id: true,
                    name: true,
                    stockLevel: true
                }
            });
            // Create product map for O(1) lookup
            const productMap = new Map(products.map((p)=>[
                    p.id,
                    p
                ]));
            // Validate all items first
            for (const item of items){
                const product = productMap.get(item.productId);
                if (!product) {
                    console.error(`❌ Product Not Found: ${item.productId}`);
                    throw new Error(`Product Not Found: ${item.productId}`);
                }
                if (product.stockLevel < item.quantity) {
                    console.error(`❌ Insufficient Stock: ${product.name} (Need: ${item.quantity}, Have: ${product.stockLevel})`);
                    throw new Error(`Out of Stock: ${product.name} (Need: ${item.quantity}, Available: ${product.stockLevel})`);
                }
                console.log(`✅ Stock Check Passed: ${product.name} (Deducting: ${item.quantity})`);
                saleLines.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price
                });
            }
            // 🚀 OPTIMIZED: Batch update all products in parallel
            await Promise.all(items.map((item)=>tx.product.update({
                    where: {
                        id: item.productId
                    },
                    data: {
                        stockLevel: {
                            decrement: item.quantity
                        }
                    }
                })));
            // D. Create Sale Record
            const createdSale = await tx.sale.create({
                data: {
                    userId,
                    shopId,
                    totalAmount,
                    paymentMethod,
                    status: "COMPLETED",
                    items: {
                        create: saleLines
                    }
                }
            });
            console.log("✅ DATABASE: Sale record created:", createdSale.id);
            return createdSale;
        });
        console.log("✅ SERVER_ACTION: Sale Completed:", sale.id);
        // 3. Revalidate Paths (Dashboard/History)
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/mobilepos/history");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/mobilepos");
        return {
            success: true,
            saleId: sale.id
        };
    } catch (error) {
        console.error("❌ SERVER_ACTION_ERROR:", error.message);
        console.error("Stack:", error.stack);
        return {
            success: false,
            error: error.message || "Transaction Failed"
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    processTransaction
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(processTransaction, "7cc3ec16eba3023776a0853c7f2f780d37ac8f14b7", null);
}),
"[project]/apps/agent/.next-internal/server/app/mobilepos/pos/page/actions.js { ACTIONS_MODULE0 => \"[project]/apps/agent/src/lib/actions/transaction.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$agent$2f$src$2f$lib$2f$actions$2f$transaction$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/agent/src/lib/actions/transaction.ts [app-rsc] (ecmascript)");
;
}),
"[project]/apps/agent/.next-internal/server/app/mobilepos/pos/page/actions.js { ACTIONS_MODULE0 => \"[project]/apps/agent/src/lib/actions/transaction.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "7cc3ec16eba3023776a0853c7f2f780d37ac8f14b7",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$agent$2f$src$2f$lib$2f$actions$2f$transaction$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["processTransaction"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$agent$2f2e$next$2d$internal$2f$server$2f$app$2f$mobilepos$2f$pos$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$apps$2f$agent$2f$src$2f$lib$2f$actions$2f$transaction$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/apps/agent/.next-internal/server/app/mobilepos/pos/page/actions.js { ACTIONS_MODULE0 => "[project]/apps/agent/src/lib/actions/transaction.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$agent$2f$src$2f$lib$2f$actions$2f$transaction$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/agent/src/lib/actions/transaction.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=apps_agent_0eda9246._.js.map