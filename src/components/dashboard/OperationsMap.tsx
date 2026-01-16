"use client";

import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --- 1. TECHNICAL ICON DESIGN ---
// Creating a custom technical marker to replace the default blue drop
const createTechnicalIcon = (color: string) => L.divIcon({
  className: "custom-technical-marker",
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-8 h-8 ${color} opacity-20 animate-ping rounded-full"></div>
      <div class="relative w-3 h-3 ${color} border-2 border-white rounded-full shadow-lg"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const icons = {
  active: createTechnicalIcon("bg-blue-600"),
  stable: createTechnicalIcon("bg-slate-900"),
};

// --- 2. REGIONAL NODE DATA ---
const NODES = [
  {
    id: "accra-mall-01",
    name: "Accra Mall Hub",
    coords: [5.6225, -0.1730] as [number, number],
    status: "active",
    metrics: "High Traffic",
    personnel: 12
  },
  {
    id: "kumasi-mall-02",
    name: "Kumasi Regional Center",
    coords: [6.6747, -1.6101] as [number, number],
    status: "stable",
    metrics: "Steady",
    personnel: 8
  }
];

export default function OperationsMap() {
  const center: [number, number] = [6.15, -0.2]; // Center of Ghana operational area

  return (
    <div className="w-full h-full relative group">
      <MapContainer 
        center={center} 
        zoom={7.5} 
        scrollWheelZoom={false}
        zoomControl={false}
        className="w-full h-full z-0"
        attributionControl={false}
      >
        {/* 3. MINIMALIST DARK/GREY TILE LAYER */}
        {/* Using CartoDB Positron for a clean, professional grayscale look */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {NODES.map((node) => (
          <React.Fragment key={node.id}>
            {/* Range Indicator */}
            <Circle 
              center={node.coords}
              radius={8000} // 8km radius
              pathOptions={{ 
                fillColor: node.status === 'active' ? '#2563eb' : '#64748b',
                fillOpacity: 0.05,
                color: 'transparent'
              }}
            />
            
            {/* Technical Node Marker */}
            <Marker 
              position={node.coords} 
              icon={node.status === 'active' ? icons.active : icons.stable}
            >
              <Popup className="nexus-popup">
                <div className="p-1 min-w-[140px]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Node Identity</p>
                  <p className="text-[11px] font-bold text-slate-900 mb-2">{node.name}</p>
                  
                  <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2">
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Status</p>
                      <p className={`text-[9px] font-black uppercase ${node.status === 'active' ? 'text-blue-600' : 'text-slate-600'}`}>
                        {node.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Personnel</p>
                      <p className="text-[9px] font-black text-slate-900">{node.personnel} Units</p>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}
      </MapContainer>

      {/* 4. MAP LEGEND OVERLAY */}
      <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur-md p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Active Sync</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Stable Node</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .nexus-popup .leaflet-popup-content-wrapper {
          border-radius: 8px;
          padding: 0;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
          border: 1px solid #e2e8f0;
        }
        .nexus-popup .leaflet-popup-content {
          margin: 0;
          padding: 8px;
        }
        .nexus-popup .leaflet-popup-tip-container {
          display: none;
        }
        .leaflet-container {
          background: #f8fafc !important;
        }
      `}</style>
    </div>
  );
}