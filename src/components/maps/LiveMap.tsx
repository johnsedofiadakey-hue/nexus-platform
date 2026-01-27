"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  Circle,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Building2,
  User,
  AlertCircle,
  Navigation,
  Layers, // New Icon for the toggle
  Globe,
  Map as MapIcon
} from "lucide-react";

/* -------------------------------------------------------
   1. GEO HELPERS
------------------------------------------------------- */
const getCoords = (item: any): [number, number] | null => {
  if (!item) return null;
  const lat = item.lastLat ?? item.latitude ?? item.location?.lat ?? item.lat;
  const lng = item.lastLng ?? item.longitude ?? item.location?.lng ?? item.lng;
  const la = Number(lat);
  const ln = Number(lng);
  return Number.isFinite(la) && Number.isFinite(ln) ? [la, ln] : null;
};

const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) => {
  const R = 6371e3; 
  const toRad = (v: number) => (v * Math.PI) / 180;
  const a =
    Math.sin(toRad(lat2 - lat1) / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(toRad(lng2 - lng1) / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

/* -------------------------------------------------------
   2. CUSTOM ICONS
------------------------------------------------------- */
const createShopIcon = () =>
  L.divIcon({
    html: renderToStaticMarkup(
      <div className="relative flex items-center justify-center w-12 h-12">
        <div className="absolute w-full h-full bg-blue-500 rounded-full opacity-20 animate-ping" />
        <div className="relative bg-slate-900 text-white p-2.5 rounded-xl border-2 border-white shadow-2xl">
          <Building2 size={18} />
        </div>
        <div className="absolute -bottom-2 bg-white text-[8px] font-black px-1.5 rounded text-slate-900 border border-slate-200">HUB</div>
      </div>
    ),
    className: "bg-transparent",
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });

const createRepIcon = (status: "green" | "yellow" | "red") =>
  L.divIcon({
    html: renderToStaticMarkup(
      <div className="w-10 h-10 flex items-center justify-center relative group">
        <div
          className={`w-9 h-9 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white transition-colors duration-500 ${
            status === "green"
              ? "bg-emerald-500"
              : status === "yellow"
              ? "bg-amber-500"
              : "bg-rose-500"
          }`}
        >
          {status === "red" ? (
            <AlertCircle size={16} />
          ) : (
            <User size={16} />
          )}
        </div>
      </div>
    ),
    className: "bg-transparent",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

/* -------------------------------------------------------
   3. AUTO FIT BOUNDS
------------------------------------------------------- */
const FitBounds = ({ items }: { items: any[] }) => {
  const map = useMap();
  useEffect(() => {
    const coords = items
      .map(getCoords)
      .filter((c): c is [number, number] => !!c);

    if (coords.length > 0) {
      map.flyToBounds(coords, { padding: [80, 80], maxZoom: 16, duration: 1.5 });
    }
  }, [items, map]);
  return null;
};

/* -------------------------------------------------------
   4. MAIN MAP COMPONENT
------------------------------------------------------- */
interface LiveMapProps {
  shops?: any[];
  reps?: any[];
  mapType?: "GLOBAL" | "SATELLITE";
}

export default function LiveMap({
  shops = [],
  reps = [],
  mapType: initialMapType = "GLOBAL",
}: LiveMapProps) {
  const [mounted, setMounted] = useState(false);
  // 🕹️ Internal State for the Toggle (defaults to prop, but can change)
  const [currentMapType, setCurrentMapType] = useState(initialMapType);

  // Sync prop changes if the parent forces a change
  useEffect(() => { setCurrentMapType(initialMapType); }, [initialMapType]);

  const mapKey = useMemo(
    () => `map-${currentMapType}-${shops.length}-${reps.length}-${shops[0]?.id || 'no-shop'}`,
    [currentMapType, shops.length, reps.length, shops]
  );

  useEffect(() => {
    setMounted(true);
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-full h-full rounded-3xl overflow-hidden bg-slate-50 isolate z-0 relative group">
      
      {/* 🎮 FLOATING TOGGLE SWITCH */}
      <div className="absolute top-4 right-4 z-[500]">
        <button
          onClick={(e) => {
             e.stopPropagation(); // Stop map clickthrough
             setCurrentMapType(prev => prev === "SATELLITE" ? "GLOBAL" : "SATELLITE");
          }}
          className="bg-white/90 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-xl flex items-center gap-1 transition-all hover:scale-105"
        >
          <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase transition-all cursor-pointer ${currentMapType === 'GLOBAL' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
             <MapIcon size={12} />
             <span>Map</span>
          </div>
          <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase transition-all cursor-pointer ${currentMapType === 'SATELLITE' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
             <Globe size={12} />
             <span>Sat</span>
          </div>
        </button>
      </div>

      <MapContainer
        key={mapKey}
        center={[5.6037, -0.187]}
        zoom={12}
        zoomControl={false}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution="&copy; Google Maps"
          // Toggle between Satellite (Hybrid) and Clean Light Map
          url={currentMapType === 'SATELLITE' 
            ? "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" // 'y' is Hybrid (Sat + Labels)
            : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
        />

        <FitBounds items={[...shops, ...reps]} />

        {shops.map((shop) => {
          const loc = getCoords(shop);
          if (!loc) return null;

          return (
            <React.Fragment key={`shop-${shop.id}`}>
              <Circle
                center={loc}
                radius={Number(shop.radius) || 100}
                pathOptions={{
                  color: "#3b82f6",
                  fillColor: "#3b82f6",
                  fillOpacity: 0.1,
                  weight: 1,
                  dashArray: "5,10",
                }}
              />
              <Marker position={loc} icon={createShopIcon()}>
                <Tooltip permanent direction="top" className="font-bold text-xs uppercase tracking-widest border-0 shadow-lg text-slate-900">
                  {shop.name}
                </Tooltip>
              </Marker>
            </React.Fragment>
          );
        })}

        {reps.map((rep) => {
          const repLoc = getCoords(rep);
          if (!repLoc) return null;

          const shop = shops.find(
            (s) => s.id === rep.shopId || s.id === rep.assignedShopId
          );
          const shopLoc = getCoords(shop);

          let status: "green" | "yellow" | "red" = "red";
          let distance = 0;

          if (shopLoc) {
            distance = calculateDistance(shopLoc[0], shopLoc[1], repLoc[0], repLoc[1]);
            const radius = Number(shop?.radius) || 100;
            status = distance <= radius ? "green" : distance <= radius + 200 ? "yellow" : "red";
          }

          return (
            <React.Fragment key={`rep-${rep.id}`}>
              {shopLoc && (
                <Polyline
                  positions={[shopLoc, repLoc]}
                  pathOptions={{
                    color: status === "green" ? "#10b981" : status === "yellow" ? "#f59e0b" : "#ef4444",
                    dashArray: "6, 8",
                    opacity: 0.8,
                    weight: 3
                  }}
                />
              )}
              
              <Marker position={repLoc} icon={createRepIcon(status)}>
                <Tooltip direction="bottom" offset={[0, 10]} className="border-0 shadow-xl rounded-xl p-0 overflow-hidden">
                  <div className="bg-white p-3 text-center min-w-[140px]">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Agent ID: {rep.name}</p>
                    {distance > 0 ? (
                      <div className={`flex items-center justify-center gap-1.5 text-xs font-black ${
                        status === 'green' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                         <Navigation size={12} />
                         <span>{distance}m Drift</span>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-slate-300">Calculating...</span>
                    )}
                  </div>
                </Tooltip>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}