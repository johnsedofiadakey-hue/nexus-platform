"use client";

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js
const fixIcons = () => {
  if (typeof window !== 'undefined') {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }
};

interface AdminHQMapProps {
  shops: any[];
}

export default function AdminHQMap({ shops }: AdminHQMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fixIcons();

    // 1. If we don't have the div, or map is already here, stop.
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // 2. Initialize the map manually (bypass MapContainer component)
    const map = L.map(mapContainerRef.current).setView([5.6037, -0.1870], 11);
    
    // 3. Add the Tile Layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; Carto'
    }).addTo(map);

    // 4. Add Shops as Markers
    shops.forEach(shop => {
      if (shop.latitude && shop.longitude) {
        L.marker([shop.latitude, shop.longitude])
          .addTo(map)
          .bindPopup(`<b>${shop.name}</b><br>${shop.location}`);
      }
    });

    // 5. Store the instance in our Ref
    mapInstanceRef.current = map;
    setIsLoaded(true);

    // 6. 🛡️ THE CLEANUP: This is what prevents the "Already Initialized" error
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove(); // This completely kills the map instance
        mapInstanceRef.current = null;   // Clear the ref for the next mount
      }
    };
  }, [shops]);

  return (
    <div className="w-full h-full relative border border-slate-200 rounded-md overflow-hidden bg-slate-50">
      {/* 🛡️ Leaflet will attach specifically to this div */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full" 
        style={{ zIndex: 1 }}
      />
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
          <Loader2 className="animate-spin text-slate-400" size={20} />
        </div>
      )}
    </div>
  );
}

import { Loader2 } from "lucide-react";