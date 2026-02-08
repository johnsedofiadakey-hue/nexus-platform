(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/apps/admin/src/components/maps/GeofenceMap.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>GeofenceMap
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$leaflet$40$1$2e$9$2e$4$2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/leaflet@1.9.4/node_modules/leaflet/dist/leaflet-src.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$563$2e$0_react$40$19$2e$2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/lucide-react@0.563.0_react@19.2.4/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-client] (ecmascript) <export default as Loader2>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
// Standard Leaflet Marker Fix
const fixIcons = ()=>{
    if ("TURBOPACK compile-time truthy", 1) {
        // @ts-ignore
        delete __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$leaflet$40$1$2e$9$2e$4$2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Icon.Default.prototype._getIconUrl;
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$leaflet$40$1$2e$9$2e$4$2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
        });
    }
};
function GeofenceMap({ shopLat, shopLng, shopRadius, userLat, userLng }) {
    _s();
    const mapRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const mapInstance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const tileLayerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [isReady, setIsReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [mapStyle, setMapStyle] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('SATELLITE');
    // LAYERS
    const SATELLITE_URL = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
    const STREET_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'; // Carto Voyager
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GeofenceMap.useEffect": ()=>{
            fixIcons();
            // 🛡️ STOP: If no div, do nothing. 
            if (!mapRef.current) return;
            // 1. Initialize Map Instance (Only once)
            if (!mapInstance.current) {
                const map = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$leaflet$40$1$2e$9$2e$4$2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].map(mapRef.current, {
                    zoomControl: false,
                    scrollWheelZoom: false
                }).setView([
                    shopLat,
                    shopLng
                ], 16);
                mapInstance.current = map;
                // Add Zoom Control back at top right
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$leaflet$40$1$2e$9$2e$4$2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].control.zoom({
                    position: 'topright'
                }).addTo(map);
                // Add Shop Marker (Blue)
                const shopIcon = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$leaflet$40$1$2e$9$2e$4$2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [
                        25,
                        41
                    ],
                    iconAnchor: [
                        12,
                        41
                    ]
                });
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$leaflet$40$1$2e$9$2e$4$2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].marker([
                    shopLat,
                    shopLng
                ], {
                    icon: shopIcon
                }).addTo(map).bindPopup("<b>Assigned Hub</b>");
                // Add Geofence Circle (Emerald/Green)
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$leaflet$40$1$2e$9$2e$4$2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].circle([
                    shopLat,
                    shopLng
                ], {
                    radius: shopRadius,
                    color: '#10b981',
                    fillColor: '#10b981',
                    fillOpacity: 0.15,
                    weight: 2
                }).addTo(map);
                setIsReady(true);
            }
            const map = mapInstance.current;
            // 2. Manage Tile Layer
            if (tileLayerRef.current) {
                map.removeLayer(tileLayerRef.current);
            }
            const newLayer = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$leaflet$40$1$2e$9$2e$4$2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].tileLayer(mapStyle === 'SATELLITE' ? SATELLITE_URL : STREET_URL, {
                attribution: mapStyle === 'SATELLITE' ? '© Google' : '&copy; Carto'
            });
            newLayer.addTo(map);
            tileLayerRef.current = newLayer;
        // 5. Update User Marker (Dynamic)
        // We need to manage this better if position updates, but primarily this effect runs on props change.
        // Ideally we clear old user markers or use a ref. For now, let's keep it simple as re-renders are rare.
        // Actually, to avoid duplicates on re-render, we should track the user marker.
        // But given the scope, and that page likely doesn't spam updates, let's just add it. 
        // Wait, adding it every effect run will duplicate it. Let's fix that.
        // NOTE: In this simplified refactor, I'm just toggling layers. 
        // Use a separate effect for User Marker updates to be cleaner, OR just clear layers.
        // But since I can't easily refactor EVERYTHING, I'll stick to the previous pattern 
        // but moving Tile logic here allows toggle.
        // Let's add the User Marker logic in a separate block or simple check.
        // To properly fix duplication, we'd need a userMarkerRef. 
        // I'll add `userMarkerRef` to the component scope in the next edit or assume it's okay for now.
        // Actually, let's just stick to the requested change: TOGGLE.
        // Re-adding user marker on every style change is bad.
        // I will separate the concerns: 
        // Effect 1 [mapStyle]: Updates Tile Layer.
        // Effect 2 [userLat, userLng]: Updates User Marker.
        // But I have to rewrite the whole useEffect block.
        }
    }["GeofenceMap.useEffect"], [
        mapStyle
    ]);
    // SEPARATE EFFECT FOR USER MARKER & INIT
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GeofenceMap.useEffect": ()=>{
            if (!mapInstance.current || !userLat || !userLng) return;
            const map = mapInstance.current;
            // Remove existing markers? (Not easily tracked without ref)
            // Let's just add it for now, assuming full reload on significant change.
            const userIcon = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$leaflet$40$1$2e$9$2e$4$2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].Icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [
                    25,
                    41
                ],
                iconAnchor: [
                    12,
                    41
                ]
            });
            const m = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$leaflet$40$1$2e$9$2e$4$2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].marker([
                userLat,
                userLng
            ], {
                icon: userIcon
            }).addTo(map).bindPopup("<b>Agent Location</b>");
            const bounds = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$leaflet$40$1$2e$9$2e$4$2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].latLngBounds([
                [
                    shopLat,
                    shopLng
                ],
                [
                    userLat,
                    userLng
                ]
            ]);
            map.fitBounds(bounds, {
                padding: [
                    50,
                    50
                ]
            });
            return ({
                "GeofenceMap.useEffect": ()=>{
                    map.removeLayer(m);
                }
            })["GeofenceMap.useEffect"];
        }
    }["GeofenceMap.useEffect"], [
        userLat,
        userLng
    ]);
    // CLEANUP
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GeofenceMap.useEffect": ()=>{
            return ({
                "GeofenceMap.useEffect": ()=>{
                    if (mapInstance.current) {
                        mapInstance.current.remove();
                        mapInstance.current = null;
                    }
                }
            })["GeofenceMap.useEffect"];
        }
    }["GeofenceMap.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full h-full relative bg-slate-50 border border-slate-200 rounded-md overflow-hidden group",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: mapRef,
                className: "w-full h-full grayscale-[0.2] contrast-[1.1]",
                style: {
                    zIndex: 1
                }
            }, void 0, false, {
                fileName: "[project]/apps/admin/src/components/maps/GeofenceMap.tsx",
                lineNumber: 150,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute bottom-4 left-4 z-[500] flex gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setMapStyle('STREET'),
                        className: `px-3 py-1 text-xs font-bold rounded shadow-lg backdrop-blur-md transition-all ${mapStyle === 'STREET' ? 'bg-blue-600 text-white' : 'bg-white/80 text-slate-600 hover:bg-white'}`,
                        children: "Map"
                    }, void 0, false, {
                        fileName: "[project]/apps/admin/src/components/maps/GeofenceMap.tsx",
                        lineNumber: 158,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setMapStyle('SATELLITE'),
                        className: `px-3 py-1 text-xs font-bold rounded shadow-lg backdrop-blur-md transition-all ${mapStyle === 'SATELLITE' ? 'bg-blue-600 text-white' : 'bg-white/80 text-slate-600 hover:bg-white'}`,
                        children: "Satellite"
                    }, void 0, false, {
                        fileName: "[project]/apps/admin/src/components/maps/GeofenceMap.tsx",
                        lineNumber: 164,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/admin/src/components/maps/GeofenceMap.tsx",
                lineNumber: 157,
                columnNumber: 7
            }, this),
            !isReady && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$563$2e$0_react$40$19$2e$2$2e$4$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                        className: "w-5 h-5 text-slate-900 animate-spin mb-2"
                    }, void 0, false, {
                        fileName: "[project]/apps/admin/src/components/maps/GeofenceMap.tsx",
                        lineNumber: 174,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[10px] font-bold uppercase tracking-widest text-slate-400",
                        children: "Syncing Satellite..."
                    }, void 0, false, {
                        fileName: "[project]/apps/admin/src/components/maps/GeofenceMap.tsx",
                        lineNumber: 175,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/admin/src/components/maps/GeofenceMap.tsx",
                lineNumber: 173,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/admin/src/components/maps/GeofenceMap.tsx",
        lineNumber: 149,
        columnNumber: 5
    }, this);
}
_s(GeofenceMap, "TgrPXzy96wypYAIg0gkl0OMvvWQ=");
_c = GeofenceMap;
var _c;
__turbopack_context__.k.register(_c, "GeofenceMap");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/admin/src/components/maps/GeofenceMap.tsx [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/apps/admin/src/components/maps/GeofenceMap.tsx [app-client] (ecmascript)"));
}),
]);

//# sourceMappingURL=apps_admin_src_components_maps_GeofenceMap_tsx_d8931941._.js.map