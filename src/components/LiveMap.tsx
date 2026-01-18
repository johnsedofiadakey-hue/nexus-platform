'use client';

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, Circle, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- 1. STYLES (Pulse & Rep Dots) ---
const styles = `
  /* Shop Pulse Effect */
  @keyframes pulse-ring {
    0% { transform: scale(0.33); opacity: 0.8; }
    80%, 100% { opacity: 0; }
  }
  @keyframes pulse-dot {
    0% { transform: scale(0.8); }
    50% { transform: scale(1); }
    100% { transform: scale(0.8); }
  }
  .shop-pulse-icon { position: relative; }
  .shop-pulse-icon::before {
    content: ''; position: relative; display: block;
    width: 300%; height: 300%; box-sizing: border-box;
    margin-left: -100%; margin-top: -100%;
    border-radius: 45px; background-color: #0ea5e9;
    animation: pulse-ring 1.25s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
  }
  .shop-pulse-icon::after {
    content: ''; position: absolute; left: 0; top: 0;
    display: block; width: 100%; height: 100%;
    background-color: white; border-radius: 15px;
    box-shadow: 0 0 8px rgba(0,0,0,.3);
    animation: pulse-dot 1.25s cubic-bezier(0.455, 0.03, 0.515, 0.955) -0.4s infinite;
  }

  /* Rep Status Dots */
  .rep-dot { border: 2px solid white; border-radius: 50%; box-shadow: 0 0 4px rgba(0,0,0,0.4); }
  .rep-green { background-color: #22c55e; } /* Green = In Zone */
  .rep-yellow { background-color: #eab308; } /* Yellow = Nearby */
  .rep-red { background-color: #ef4444; }    /* Red = Far Away */
  
  /* Label Styling */
  .shop-label { 
    background: transparent; 
    border: none; 
    box-shadow: none; 
    font-weight: 900; 
    color: #0f172a; 
    text-shadow: 2px 2px 0px white, -1px -1px 0px white;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

// --- 2. TYPES & HELPERS ---
interface Coords { lat: number; lng: number; }

export interface Shop {
  id: string;
  name: string;
  // Flexible coords to prevent crashes
  location?: any; latitude?: number; longitude?: number;
  radiusMeters?: number; 
}

export interface Rep {
  id: string;
  name: string;
  location?: any; latitude?: number; longitude?: number;
  assignedShopId?: string; // Critical for distance calculation
}

interface OperationsMapProps {
  shops: Shop[];
  reps?: Rep[]; // Optional, defaults to empty
}

// Robust coordinate extractor (Handles flat or nested objects)
const getCoords = (item: any): Coords | null => {
  if (!item) return null;
  if (item.location && typeof item.location.lat === 'number') return { lat: item.location.lat, lng: item.location.lng };
  if (typeof item.latitude === 'number') return { lat: item.latitude, lng: item.longitude };
  if (typeof item.lat === 'number') return { lat: item.lat, lng: item.lng };
  return null;
};

// Distance Calculator
const calculateDistance = (loc1: Coords, loc2: Coords): number => {
  const R = 6371e3; 
  const toRad = (val: number) => (val * Math.PI) / 180;
  const φ1 = toRad(loc1.lat);
  const φ2 = toRad(loc2.lat);
  const a = Math.sin(toRad(loc2.lat - loc1.lat) / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(toRad(loc2.lng - loc1.lng) / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// Auto-Zoom Component
const FitBounds = ({ items }: { items: any[] }) => {
  const map = useMap();
  useEffect(() => {
    const validCoords = items.map(getCoords).filter((c): c is Coords => c !== null);
    if (validCoords.length === 0) return;
    try {
      map.fitBounds(L.latLngBounds(validCoords.map(c => [c.lat, c.lng])), { padding: [50, 50] });
    } catch (e) { console.warn("Bounds Error:", e); }
  }, [items, map]);
  return null;
};

// --- 3. MAIN COMPONENT ---
const LiveMap: React.FC<OperationsMapProps> = ({ shops = [], reps = [] }) => {
  
  // Inject Styles
  useEffect(() => {
    const styleId = 'leaflet-custom-styles';
    if (!document.getElementById(styleId)) {
      const el = document.createElement('style');
      el.id = styleId; el.innerHTML = styles;
      document.head.appendChild(el);
    }
  }, []);

  const shopIcon = L.divIcon({ className: 'shop-pulse-icon', iconSize: [12, 12], iconAnchor: [6, 6] });
  const getRepIcon = (status: string) => L.divIcon({ className: `rep-dot rep-${status}`, iconSize: [14, 14], iconAnchor: [7, 7] });

  return (
    <div className="w-full h-full z-0 relative font-sans">
      <MapContainer center={[5.6037, -0.1870]} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
        <FitBounds items={[...shops, ...reps]} />

        {/* --- SHOPS (The Anchor) --- */}
        {shops.map((shop) => {
          const loc = getCoords(shop);
          if (!loc) return null;
          const radius = shop.radiusMeters || 100;

          return (
            <React.Fragment key={`shop-${shop.id}`}>
              {/* Coverage Circle */}
              <Circle 
                center={loc} 
                radius={radius} 
                pathOptions={{ color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.08, weight: 1, dashArray: '4' }} 
              />
              {/* Shop Marker + Permanent Label */}
              <Marker position={loc} icon={shopIcon}>
                <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent className="shop-label">
                  {shop.name}
                </Tooltip>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* --- REPS (The Moving Target) --- */}
        {reps.map((rep) => {
          const repLoc = getCoords(rep);
          if (!repLoc) return null;

          // Check Status vs Assigned Shop
          const shop = shops.find(s => s.id === rep.assignedShopId);
          let status = 'red'; // Default: Far/Unknown
          let distance = 0;
          let shopLoc: Coords | null = null;

          if (shop) {
            shopLoc = getCoords(shop);
            if (shopLoc) {
              distance = calculateDistance(shopLoc, repLoc);
              const radius = shop.radiusMeters || 100;
              if (distance <= radius) status = 'green';           // Present
              else if (distance <= radius + 150) status = 'yellow'; // Nearby
            }
          }

          return (
            <React.Fragment key={`rep-${rep.id}`}>
              {/* Connection Line (Only if shop exists) */}
              {shopLoc && (
                <Polyline 
                  positions={[shopLoc, repLoc]}
                  pathOptions={{ 
                    color: status === 'green' ? '#22c55e' : status === 'yellow' ? '#eab308' : '#ef4444', 
                    weight: 2, dashArray: '5, 5', opacity: 0.6 
                  }}
                />
              )}
              {/* Rep Marker */}
              <Marker position={repLoc} icon={getRepIcon(status)}>
                <Tooltip direction="bottom" offset={[0, 10]} opacity={0.9}>
                  <div className="text-center text-xs">
                    <strong className="block text-slate-900">{rep.name}</strong>
                    <span className={status === 'green' ? 'text-green-600 font-bold' : status === 'yellow' ? 'text-yellow-600 font-bold' : 'text-red-600 font-bold'}>
                      {status === 'green' ? 'In Zone' : status === 'yellow' ? 'Nearby' : 'Off-Site'}
                    </span>
                    {distance > 0 && <div className="text-[10px] text-slate-500">{distance}m away</div>}
                  </div>
                </Tooltip>
              </Marker>
            </React.Fragment>
          );
        })}

      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur px-3 py-2 rounded-lg shadow-lg border border-slate-200 z-[1000] text-[10px] font-medium">
        <div className="flex items-center gap-2 mb-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 border border-white shadow-sm"></span><span className="text-slate-600">Present (In Zone)</span></div>
        <div className="flex items-center gap-2 mb-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 border border-white shadow-sm"></span><span className="text-slate-600">Nearby (Perimeter)</span></div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white shadow-sm"></span><span className="text-slate-600">Off-Site (Far)</span></div>
      </div>
    </div>
  );
};

export default LiveMap;