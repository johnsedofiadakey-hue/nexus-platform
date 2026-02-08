"use client";

import React from "react";
import { MapPin } from "lucide-react";

interface GeofenceEvent {
  id: string;
  timestamp: string;
  type: 'EXIT' | 'ENTER';
  lat: number;
  lng: number;
}

interface GeofenceHistoryTableProps {
  geofenceEvents: GeofenceEvent[];
}

export default function GeofenceHistoryTable({ geofenceEvents }: GeofenceHistoryTableProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mt-8">
      <div className="p-6 border-b border-slate-100 bg-red-50/30">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
          <MapPin className="w-4 h-4 text-red-500" /> Perimeter Violation & Entry Log
        </h3>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Event Time</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Action</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase text-right">Coordinates</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {geofenceEvents?.map((event) => (
            <tr key={event.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 text-xs font-bold text-slate-700">
                {new Date(event.timestamp).toLocaleString()}
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-[4px] text-[9px] font-black uppercase ${
                  event.type === 'EXIT' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {event.type === 'EXIT' ? '🔴 Perimeter Exit' : '🟢 Re-Entered Zone'}
                </span>
              </td>
              <td className="px-6 py-4 text-right text-[10px] font-mono text-slate-400">
                {(event.lat || 0).toFixed(4)}, {(event.lng || 0).toFixed(4)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}