"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default Leaflet markers in Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Helper to auto-center the map when GPS updates
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

interface LiveMapProps {
  lat: number;
  lng: number;
  speed: number;
}

export default function LiveMap({ lat, lng, speed }: LiveMapProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={18}
      style={{ height: "100%", width: "100%", borderRadius: "2rem" }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <Marker position={[lat, lng]} icon={icon}>
        <Popup>
          <div className="text-center">
            <p className="font-bold text-xs">OPERATIVE ACTIVE</p>
            <p className="text-[10px]">Speed: {speed} km/h</p>
          </div>
        </Popup>
      </Marker>

      <MapRecenter lat={lat} lng={lng} />
    </MapContainer>
  );
}