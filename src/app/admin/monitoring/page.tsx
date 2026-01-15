"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Users, ShieldCheck, ShieldAlert, Store, Search } from 'lucide-react';

// Dynamically import Map components to avoid SSR issues with Leaflet
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false });

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet icons in Next.js
const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function StaffMonitoring() {
  // Mock Data: In production, this comes from Supabase Realtime 'User' table
  const [staffLocations, setStaffLocations] = useState([
    { id: '1', name: 'Kwame Mensah', lat: 5.6037, lng: -0.1870, status: 'ON_SITE', shop: 'Accra Mall' },
    { id: '2', name: 'Abena Selorm', lat: 5.6100, lng: -0.1900, status: 'OFF_SITE', shop: 'Accra Mall' },
    { id: '3', name: 'John Doe', lat: 6.6666, lng: -1.6163, status: 'ON_SITE', shop: 'Kumasi Hub' },
  ]);

  const shops = [
    { id: 's1', name: 'Accra Mall', lat: 5.6037, lng: -0.1870, radius: 200 },
    { id: 's2', name: 'Kumasi Hub', lat: 6.6666, lng: -1.6163, radius: 300 },
  ];

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      {/* Sidebar: Staff List */}
      <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="text-blue-500" /> SENTINEL LIVE
          </h1>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-3 text-slate-500" size={16} />
            <input 
              className="w-full bg-slate-800 border-none rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:ring-2 focus:ring-blue-600"
              placeholder="Search staff or shops..."
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase px-2 mb-2">Active Staff</p>
          {staffLocations.map((staff) => (
            <div key={staff.id} className="p-3 bg-slate-800/50 rounded-2xl border border-slate-700 hover:border-blue-500 transition-all cursor-pointer group">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-white">{staff.name}</h3>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Store size={10} /> {staff.shop}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${
                  staff.status === 'ON_SITE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {staff.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Map View */}
      <div className="flex-1 relative">
        <MapContainer 
          center={[5.6037, -0.1870]} 
          zoom={13} 
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap'
          />

          {/* Render Shop Geofences */}
          {shops.map(shop => (
            <React.Fragment key={shop.id}>
              <Circle 
                center={[shop.lat, shop.lng]}
                radius={shop.radius}
                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1 }}
              />
              <Marker position={[shop.lat, shop.lng]} icon={customIcon}>
                <Popup>
                  <div className="font-bold">{shop.name}</div>
                  <div className="text-xs">Radius: {shop.radius}m</div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}

          {/* Render Staff Pings */}
          {staffLocations.map(staff => (
            <Marker key={staff.id} position={[staff.lat, staff.lng]} icon={customIcon}>
              <Popup>
                <div className="p-2">
                  <h4 className="font-black text-slate-900">{staff.name}</h4>
                  <p className="text-xs text-slate-500">Last Ping: Just now</p>
                  <p className={`text-xs font-bold mt-1 ${staff.status === 'ON_SITE' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    Status: {staff.status}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating Metrics Overlay */}
        <div className="absolute top-6 right-6 z-[1000] flex gap-4">
          <div className="bg-white/90 backdrop-blur p-4 rounded-2xl shadow-2xl border border-slate-200 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Field Staff</p>
              <p className="text-xl font-black text-slate-900">{staffLocations.length}</p>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur p-4 rounded-2xl shadow-2xl border border-slate-200 flex items-center gap-4">
            <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
              <ShieldAlert size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Off-Site Alerts</p>
              <p className="text-xl font-black text-slate-900">1</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}