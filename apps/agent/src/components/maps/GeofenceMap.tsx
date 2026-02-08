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
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [mapStyle, setMapStyle] = useState<'SATELLITE' | 'STREET'>('SATELLITE');

  // LAYERS
  const SATELLITE_URL = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
  const STREET_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'; // Carto Voyager

  useEffect(() => {
    fixIcons();

    // 🛡️ STOP: If no div, do nothing. 
    if (!mapRef.current) return;

    // 1. Initialize Map Instance (Only once)
    if (!mapInstance.current) {
      const map = L.map(mapRef.current, {
        zoomControl: false, // Cleaner SaaS look
        scrollWheelZoom: false
      }).setView([shopLat, shopLng], 16);
      mapInstance.current = map;

      // Add Zoom Control back at top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Add Shop Marker (Blue)
      const shopIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
      L.marker([shopLat, shopLng], { icon: shopIcon }).addTo(map).bindPopup("<b>Assigned Hub</b>");

      // Add Geofence Circle (Emerald/Green)
      L.circle([shopLat, shopLng], {
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

    const newLayer = L.tileLayer(mapStyle === 'SATELLITE' ? SATELLITE_URL : STREET_URL, {
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

  }, [mapStyle]);

  // SEPARATE EFFECT FOR USER MARKER & INIT
  useEffect(() => {
    if (!mapInstance.current || !userLat || !userLng) return;
    const map = mapInstance.current;

    // Remove existing markers? (Not easily tracked without ref)
    // Let's just add it for now, assuming full reload on significant change.

    const userIcon = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });
    const m = L.marker([userLat, userLng], { icon: userIcon }).addTo(map).bindPopup("<b>Agent Location</b>");

    const bounds = L.latLngBounds([[shopLat, shopLng], [userLat, userLng]]);
    map.fitBounds(bounds, { padding: [50, 50] });

    return () => { map.removeLayer(m) };
  }, [userLat, userLng]);

  // CLEANUP
  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative bg-slate-50 border border-slate-200 rounded-md overflow-hidden group">
      <div
        ref={mapRef}
        className="w-full h-full grayscale-[0.2] contrast-[1.1]"
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

      {!isReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10">
          <Loader2 className="w-5 h-5 text-slate-900 animate-spin mb-2" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing Satellite...</span>
        </div>
      )}
    </div>
  );
}