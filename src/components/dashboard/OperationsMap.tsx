"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";

// Fix for Leaflet Icons in Next.js
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = defaultIcon;

export default function OperationsMap() {
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const response = await fetch("/api/operations/map-data");
        const data = await response.json();
        setLocations(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Map Data Sync Error");
      }
    };
    fetchMapData();
  }, []);

  return (
    <div className="h-full w-full">
      <MapContainer 
        center={[7.9465, -1.0232]} 
        zoom={7} 
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />

        {locations.map((shop) => (
          <Marker key={shop.id} position={[shop.lat, shop.lng]}>
            <Popup>
              <div className="p-1">
                <p className="font-bold text-slate-800">{shop.name}</p>
                <p className="text-xs text-blue-600 font-bold">GHS {shop.sales}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}