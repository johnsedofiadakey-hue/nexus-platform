"use client";

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2 } from "lucide-react";

// Standard Leaflet Marker Fix
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

interface GeofenceMapProps {
  shopLat: number;
  shopLng: number;
  shopRadius: number;
  userLat?: number | null;
  userLng?: number | null;
}

export default function GeofenceMap({ shopLat, shopLng, shopRadius, userLat, userLng }: GeofenceMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    fixIcons();

    // 🛡️ STOP: If no div or map already exists, do nothing
    if (!mapRef.current || mapInstance.current) return;

    // 1. Initialize Map Instance
    const map = L.map(mapRef.current, {
        zoomControl: false, // Cleaner SaaS look
        scrollWheelZoom: false
    }).setView([shopLat, shopLng], 16);

    // 2. Add Satellite Hybrid Layer
    L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      attribution: '© Google'
    }).addTo(map);

    // 3. Add Shop Marker (Blue)
    const shopIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
    });
    L.marker([shopLat, shopLng], { icon: shopIcon }).addTo(map).bindPopup("<b>Assigned Hub</b>");

    // 4. Add Geofence Circle (Emerald/Green)
    L.circle([shopLat, shopLng], {
      radius: shopRadius,
      color: '#10b981',
      fillColor: '#10b981',
      fillOpacity: 0.15,
      weight: 2
    }).addTo(map);

    // 5. Add User Marker (If GPS available)
    if (userLat && userLng) {
        const userIcon = new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
        });
        L.marker([userLat, userLng], { icon: userIcon }).addTo(map).bindPopup("<b>Agent Location</b>");
        
        // Auto-adjust view to show both user and shop
        const bounds = L.latLngBounds([[shopLat, shopLng], [userLat, userLng]]);
        map.fitBounds(bounds, { padding: [50, 50] });
    }

    // Add Zoom Control back at top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    mapInstance.current = map;
    setIsReady(true);

    // 🛡️ THE SILVER BULLET: Forceful cleanup on unmount
    return () => {
      if (mapInstance.current) {
        mapInstance.current.off(); // Remove all listeners
        mapInstance.current.remove(); // Destroy the map instance
        mapInstance.current = null;
      }
    };
  }, [shopLat, shopLng, shopRadius, userLat, userLng]);

  return (
    <div className="w-full h-full relative bg-slate-50 border border-slate-200 rounded-md overflow-hidden">
      <div 
        ref={mapRef} 
        className="w-full h-full grayscale-[0.2] contrast-[1.1]" 
        style={{ zIndex: 1 }} 
      />
      
      {!isReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10">
          <Loader2 className="w-5 h-5 text-slate-900 animate-spin mb-2" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing Satellite...</span>
        </div>
      )}
    </div>
  );
}