"use client";

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { renderToStaticMarkup } from 'react-dom/server';
import { Building2, User, Loader2 } from 'lucide-react';

// --- 🛡️ UNIQUE ID ENGINE ---
// Using a unique ID for this specific map type to prevent collisions
const MAP_ID = "hq-global-command-map";

export default function GlobalCommandMap({ shops = [], reps = [] }: any) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      const container = L.DomUtil.get(MAP_ID);
      if (container) {
        // @ts-ignore - Clean up the specific ID
        container._leaflet_id = null;
      }
    };
  }, []);

  if (!mounted) return (
    <div className="w-full h-full flex items-center justify-center bg-slate-50 min-h-[500px] rounded-[3rem]">
      <Loader2 className="animate-spin text-blue-600" />
    </div>
  );

  return (
    <MapContainer 
      id={MAP_ID}
      center={[5.6037, -0.1870]} 
      zoom={11} 
      className="w-full h-full rounded-[3rem] z-0"
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
      
      {/* GLOBAL HUB RENDERER */}
      {shops.map((shop: any) => (
        <Circle 
          key={shop.id}
          center={[parseFloat(shop.latitude), parseFloat(shop.longitude)]}
          radius={parseFloat(shop.radius) || 200}
          pathOptions={{ color: '#3b82f6', weight: 1, fillOpacity: 0.1 }}
        />
      ))}

      {/* GLOBAL AGENT RENDERER */}
      {reps.map((rep: any) => rep.lastLat && (
        <Marker 
          key={rep.id}
          position={[parseFloat(rep.lastLat), parseFloat(rep.lastLng)]}
          icon={L.divIcon({
            html: renderToStaticMarkup(
              <div className="w-3 h-3 bg-blue-600 border-2 border-white rounded-full shadow-lg" />
            ),
            className: "bg-transparent"
          })}
        />
      ))}
    </MapContainer>
  );
}