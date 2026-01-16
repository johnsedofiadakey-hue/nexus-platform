"use client";

import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const createStaffIcon = (imageUrl: string | null) => L.divIcon({
  className: "custom-staff-marker",
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-10 h-10 bg-blue-500 opacity-20 animate-ping rounded-full"></div>
      <div class="relative w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-xl bg-slate-200">
        ${imageUrl ? `<img src="${imageUrl}" class="w-full h-full object-cover" />` : `<div class="w-full h-full flex items-center justify-center text-[10px] font-black">LG</div>`}
      </div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const shopIcon = L.divIcon({
  className: "shop-node-marker",
  html: `<div class="w-4 h-4 bg-slate-900 border-2 border-white rounded shadow-lg"></div>`,
  iconSize: [16, 16]
});

export default function StaffPresenceMap({ staffData, shopData }: any) {
  const ghanaCenter: [number, number] = [5.62, -0.17];

  return (
    <div className="h-full w-full relative">
      <MapContainer center={ghanaCenter} zoom={13} className="h-full w-full z-0" zoomControl={false} attributionControl={false}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

        {/* SHOP NODES (GEOFENCES) */}
        {shopData?.map((shop: any) => (
          <React.Fragment key={shop.id}>
            <Circle 
              center={[shop.latitude, shop.longitude]} 
              radius={shop.radius} 
              pathOptions={{ fillColor: '#2563eb', fillOpacity: 0.1, color: '#2563eb', weight: 1, dashArray: '5, 10' }} 
            />
            <Marker position={[shop.latitude, shop.longitude]} icon={shopIcon}>
              <Popup>
                <p className="text-[10px] font-black text-slate-900 uppercase">{shop.name}</p>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}

        {/* STAFF REAL-TIME POSITIONS */}
        {staffData?.map((staff: any) => (
          <Marker 
            key={staff.id} 
            position={[staff.lastLat, staff.lastLng]} 
            icon={createStaffIcon(staff.image)}
          >
            <Popup className="nexus-popup">
              <div className="p-2 min-w-[160px]">
                <div className="flex items-center gap-3 mb-3 border-b border-slate-100 pb-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden">
                    <img src={staff.image || ""} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-900 uppercase leading-none">{staff.name}</p>
                    <p className="text-[8px] text-blue-600 font-bold uppercase mt-1">ID: {staff.staffId}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Assigned Hub</span>
                    <span className="text-[9px] font-black text-slate-700">{staff.shop?.name || "Unassigned"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Presence</span>
                    <span className={`text-[9px] font-black ${staff.isPresent ? 'text-emerald-500' : 'text-red-500'}`}>
                      {staff.isPresent ? 'ON-SITE' : 'OFF-SITE'}
                    </span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* FLOATING HUD */}
      <div className="absolute top-6 left-6 z-[400] bg-slate-900 text-white p-5 rounded-2xl shadow-2xl border border-white/10">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-3">Presence Telemetry</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-8">
            <span className="text-[9px] font-bold text-white/50 uppercase">Active Reps</span>
            <span className="text-[11px] font-black tracking-widest">14/20</span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="text-[9px] font-bold text-white/50 uppercase">Geofence Violations</span>
            <span className="text-[11px] font-black text-red-400 tracking-widest">02</span>
          </div>
        </div>
      </div>
    </div>
  );
}