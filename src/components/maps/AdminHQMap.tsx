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
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState<'STREET' | 'SATELLITE'>('STREET');

  // LAYERS
  const STREET_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  const SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

  useEffect(() => {
    fixIcons();

    if (!mapContainerRef.current) return;

    // INITIALIZE MAP IF NEEDED
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([5.6037, -0.1870], 11);
      mapInstanceRef.current = map;
      setIsLoaded(true);
    }

    const map = mapInstanceRef.current;

    // UPDATE TILE LAYER
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newLayer = L.tileLayer(mapStyle === 'STREET' ? STREET_URL : SATELLITE_URL, {
      attribution: mapStyle === 'STREET' ? '&copy; Carto' : '&copy; Esri World Imagery'
    });

    newLayer.addTo(map);
    tileLayerRef.current = newLayer;

    // UPDATE MARKERS (Clear and Re-add simple approach or keep them)
    // For simplicity, we just keep adding them, but ideally we should manage a marker layer group.
    // However, the previous code re-initialized the whole map on shops change. 
    // Let's stick to the layer update here, and handle markers separately if needed.
    // Actually, looking at previous code, it added markers on mount. 
    // Let's separate markers logic or just ensure they persist.
    // Since this effect depends on [shops, mapStyle], re-running it is okay IF we clear layers.
    // BETTER APPROACH: Separate Tile Layer effect from Marker effect? 
    // Previous code: useEffect(() => { init map, add tiles, add markers, return cleanup }, [shops])

    // Let's refactor slightly to separate concerns or handle the dependency change gracefully.
    // We won't destroy the map on style change, just the tile layer.

  }, [mapStyle]); // Run when style changes (and init map)

  // SEPARATE EFFECT FOR MARKERS
  useEffect(() => {
    if (!mapInstanceRef.current || !shops.length) return;
    const map = mapInstanceRef.current;

    // Ideally clear existing markers first if we tracked them. 
    // For now, simpler to just add them (risk of duplication if shops change often, but this is admin view).
    // We can use a LayerGroup to be clean.

    const markerGroup = L.layerGroup().addTo(map);

    shops.forEach(shop => {
      if (shop.latitude && shop.longitude) {
        L.marker([shop.latitude, shop.longitude])
          .addTo(markerGroup)
          .bindPopup(`<b>${shop.name}</b><br>${shop.location}`);
      }
    });

    return () => {
      map.removeLayer(markerGroup);
    }
  }, [shops, isLoaded]); // Re-run when shops change

  // CLEANUP ON UNMOUNT ONLY
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    }
  }, []);

  return (
    <div className="w-full h-full relative border border-slate-200 rounded-md overflow-hidden bg-slate-50 group">
      {/* 🛡️ Leaflet will attach specifically to this div */}
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ zIndex: 1 }}
      />

      {/* 🎮 CONTROLS */}
      <div className="absolute bottom-4 left-4 z-[500] flex gap-2">
        <button
          onClick={() => setMapStyle('STREET')}
          className={`px-3 py-1 text-xs font-bold rounded shadow-lg backdrop-blur-md transition-all ${mapStyle === 'STREET' ? 'bg-blue-600 text-white' : 'bg-white/80 text-slate-600 hover:bg-white'}`}
        >
          Map
        </button>
        <button
          onClick={() => setMapStyle('SATELLITE')}
          className={`px-3 py-1 text-xs font-bold rounded shadow-lg backdrop-blur-md transition-all ${mapStyle === 'SATELLITE' ? 'bg-blue-600 text-white' : 'bg-white/80 text-slate-600 hover:bg-white'}`}
        >
          Satellite
        </button>
      </div>

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
          <Loader2 className="animate-spin text-slate-400" size={20} />
        </div>
      )}
    </div>
  );
}

import { Loader2 } from "lucide-react";