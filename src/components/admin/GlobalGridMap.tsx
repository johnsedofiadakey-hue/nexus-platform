"use client";

import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Technical Marker Styling
const shopIcon = L.divIcon({
  className: "custom-shop-marker",
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-8 h-8 bg-blue-600 opacity-20 animate-ping rounded-full"></div>
      <div class="relative w-4 h-4 bg-slate-900 border-2 border-white rounded shadow-lg"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default function GlobalGridMap() {
  const ghanaCenter: [number, number] = [5.6037, -0.1870]; // Accra Center

  // These would ideally come from your /api/shops
  const activeNodes = [
    { id: 1, name: "Melcom Accra Mall", lat: 5.6225, lng: -0.1730, radius: 150 },
    { id: 2, name: "Game Kumasi Mall", lat: 6.6747, lng: -1.6101, radius: 200 },
    { id: 3, name: "Palace Labone", lat: 5.5685, lng: -0.1725, radius: 100 },
  ];

  return (
    <div className="h-full w-full grayscale-[0.2] contrast-[1.1]">
      <MapContainer 
        center={ghanaCenter} 
        zoom={12} 
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer 
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {activeNodes.map((node) => (
          <React.Fragment key={node.id}>
            {/* The Geofence Visualization */}
            <Circle 
              center={[node.lat, node.lng]} 
              radius={node.radius} 
              pathOptions={{ 
                fillColor: '#2563eb', 
                fillOpacity: 0.1, 
                color: '#2563eb', 
                weight: 1, 
                dashArray: '5, 10' 
              }} 
            />
            {/* The Physical Node Marker */}
            <Marker position={[node.lat, node.lng]} icon={shopIcon}>
              <Popup className="nexus-popup">
                <div className="p-2">
                  <p className="text-[10px] font-black uppercase text-slate-900 mb-1">{node.name}</p>
                  <p className="text-[8px] font-bold text-blue-600 uppercase tracking-widest">Geofence Radius: {node.radius}m</p>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
}