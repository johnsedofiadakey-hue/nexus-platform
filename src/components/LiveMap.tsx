"use client";

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
@import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
import { renderToStaticMarkup } from 'react-dom/server';
import { Building2, User, AlertCircle, Wifi } from 'lucide-react';

// --- 1. HELPERS & TYPES ---

// Robust coordinate extractor (Handles diverse API shapes)
const getCoords = (item: any): [number, number] | null => {
  if (!item) return null;
  // Handle "lastLat" (Prisma) or "location.lat" (Generic)
  const lat = item.lastLat ?? item.latitude ?? item.location?.lat;
  const lng = item.lastLng ?? item.longitude ?? item.location?.lng;
  
  if (typeof lat === 'number' && typeof lng === 'number') return [lat, lng];
  return null;
};

// Distance Calculator (Haversine)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371e3; // Earth radius in meters
  const toRad = (val: number) => (val * Math.PI) / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lng2 - lng1);

  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

// --- 2. DYNAMIC ICONS ---

const createShopIcon = () => {
  const html = renderToStaticMarkup(
    <div className="relative flex items-center justify-center w-10 h-10">
      {/* Pulse Animation Ring */}
      <div className="absolute w-full h-full bg-blue-500 rounded-full opacity-20 animate-ping"></div>
      <div className="relative bg-slate-900 text-white p-2 rounded-lg shadow-xl border-2 border-white flex items-center justify-center z-10">
        <Building2 size={16} strokeWidth={3} />
      </div>
    </div>
  );
  return L.divIcon({
    html,
    className: "bg-transparent",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const createRepIcon = (status: 'green' | 'yellow' | 'red') => {
  const colors = {
    green: "bg-emerald-500 border-white",
    yellow: "bg-amber-500 border-white",
    red: "bg-rose-500 border-white"
  };

  const html = renderToStaticMarkup(
    <div className="relative flex items-center justify-center w-8 h-8 group">
      {/* Alert Ring for Red Status */}
      {status === 'red' && <div className="absolute w-full h-full bg-rose-500 rounded-full animate-ping opacity-40" />}
      
      <div className={`${colors[status]} w-8 h-8 rounded-full border-2 shadow-md flex items-center justify-center text-white relative z-10 transition-transform duration-300 transform group-hover:scale-110`}>
        {status === 'red' ? <AlertCircle size={14} /> : <User size={14} />}
      </div>
    </div>
  );
  return L.divIcon({
    html,
    className: "bg-transparent",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// --- 3. AUTO-ZOOM COMPONENT ---
const FitBounds = ({ items }: { items: any[] }) => {
  const map = useMap();
  
  useEffect(() => {
    const coords = items.map(getCoords).filter((c): c is [number, number] => c !== null);
    if (coords.length === 0) return;
    
    // Add some padding so markers aren't on the edge
    const bounds = L.latLngBounds(coords);
    map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15 });
  }, [items, map]);
  
  return null;
};

// --- 4. MAIN MAP COMPONENT ---
export default function LiveMap({ shops = [], reps = [] }: { shops: any[]; reps: any[] }) {

  return (
    <div className="w-full h-full relative font-sans z-0">
      <MapContainer 
        center={[6.688, -1.624]} // Default Center (Kumasi approx)
        zoom={7} 
        style={{ height: '100%', width: '100%', background: '#f8fafc' }} 
        zoomControl={false}
      >
        {/* Clean, Professional Tiles (CartoDB Positron) */}
        <TileLayer 
          attribution='&copy; OpenStreetMap' 
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" 
        />
        
        <FitBounds items={[...shops, ...reps]} />

        {/* --- RENDER SHOPS --- */}
        {shops.map((shop) => {
          const loc = getCoords(shop);
          if (!loc) return null;
          const radius = shop.radius || 150; // Default radius

          return (
            <React.Fragment key={`shop-${shop.id}`}>
              {/* Geofence Zone */}
              <Circle 
                center={loc} 
                radius={radius} 
                pathOptions={{ 
                  color: '#3b82f6', 
                  fillColor: '#3b82f6', 
                  fillOpacity: 0.05, 
                  weight: 1.5, 
                  dashArray: '6, 6' 
                }} 
              />
              
              {/* Shop Marker */}
              <Marker position={loc} icon={createShopIcon()}>
                <Tooltip 
                  direction="top" 
                  offset={[0, -20]} 
                  opacity={1} 
                  permanent 
                  className="!bg-white !border-slate-200 !text-slate-800 !font-black !text-[10px] !uppercase !tracking-widest !rounded-md !shadow-md !px-3 !py-1"
                >
                  {shop.name}
                </Tooltip>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* --- RENDER REPS --- */}
        {reps.map((rep) => {
          const repLoc = getCoords(rep);
          if (!repLoc) return null;

          // Logic: Find Assigned Shop & Check Distance
          // Using 'shopId' (from Prisma Schema) or 'assignedShopId' (fallback)
          const shopId = rep.shopId || rep.assignedShopId;
          const assignedShop = shops.find(s => s.id === shopId);
          
          let status: 'green' | 'yellow' | 'red' = 'red'; // Default: Far/Unknown
          let shopLoc: [number, number] | null = null;
          let distance = 0;

          if (assignedShop) {
            shopLoc = getCoords(assignedShop);
            if (shopLoc) {
              distance = calculateDistance(shopLoc[0], shopLoc[1], repLoc[0], repLoc[1]);
              const radius = assignedShop.radius || 150;
              
              if (distance <= radius) status = 'green';           // ✅ Inside Zone
              else if (distance <= radius + 300) status = 'yellow'; // ⚠️ Nearby (Buffer)
              else status = 'red';                                  // ❌ Far away
            }
          }

          return (
            <React.Fragment key={`rep-${rep.id}`}>
              {/* Connection Line (Visual Tether) */}
              {shopLoc && (
                <Polyline 
                  positions={[shopLoc, repLoc]}
                  pathOptions={{ 
                    color: status === 'green' ? '#10b981' : status === 'yellow' ? '#f59e0b' : '#ef4444', 
                    weight: 2, 
                    dashArray: '4, 8', 
                    opacity: 0.4 
                  }}
                />
              )}

              {/* Rep Marker */}
              <Marker position={repLoc} icon={createRepIcon(status)}>
                <Tooltip direction="bottom" offset={[0, 16]} opacity={1} className="!bg-white/90 !backdrop-blur !border-none !shadow-xl !rounded-xl !p-0 overflow-hidden">
                  <div className="w-48">
                    <div className={`h-1.5 w-full ${status === 'green' ? 'bg-emerald-500' : status === 'yellow' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-xs font-black text-slate-900 uppercase">{rep.name}</strong>
                        {status === 'green' && <Wifi size={12} className="text-emerald-500" />}
                      </div>
                      
                      <div className="text-[10px] text-slate-500 font-medium flex flex-col gap-0.5">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${status === 'green' ? 'bg-emerald-500' : status === 'yellow' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                          {status === 'green' ? 'On Site' : status === 'yellow' ? 'Perimeter' : 'Off-Site'}
                        </span>
                        {distance > 0 && <span>📍 {distance}m from Hub</span>}
                        {rep.lastSync && <span className="opacity-70">🕒 {new Date(rep.lastSync).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>}
                      </div>
                    </div>
                  </div>
                </Tooltip>
              </Marker>
            </React.Fragment>
          );
        })}

      </MapContainer>

      {/* --- LEGEND --- */}
      <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-2xl border border-white/20 z-[1000] text-[10px] font-bold">
        <h4 className="text-slate-400 uppercase tracking-widest mb-2 text-[9px]">Status Key</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm border border-white" />
            <span className="text-slate-700">In Zone (Active)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm border border-white animate-pulse" />
            <span className="text-slate-700">Nearby (Buffer)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm border border-white" />
            <span className="text-slate-700">Off-Site / Alert</span>
          </div>
        </div>
      </div>
    </div>
  );
};