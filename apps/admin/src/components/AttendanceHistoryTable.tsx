"use client";

import React from "react";
import { Clock, MapPin } from "lucide-react";

interface AttendanceRecord {
  id: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  location?: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT';
}

interface AttendanceHistoryTableProps {
  attendanceRecords: AttendanceRecord[];
}

export default function AttendanceHistoryTable({ attendanceRecords }: AttendanceHistoryTableProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mt-8">
      <div className="p-6 border-b border-slate-100 bg-green-50/30">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
          <Clock className="w-4 h-4 text-green-500" /> Attendance History
        </h3>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Date</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Clock In</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Clock Out</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Location</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {attendanceRecords?.map((record) => (
            <tr key={record.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 text-xs font-bold text-slate-700">
                {new Date(record.date).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-xs font-bold text-slate-700">
                {record.clockIn ? new Date(record.clockIn).toLocaleTimeString() : 'N/A'}
              </td>
              <td className="px-6 py-4 text-xs font-bold text-slate-700">
                {record.clockOut ? new Date(record.clockOut).toLocaleTimeString() : 'N/A'}
              </td>
              <td className="px-6 py-4 text-xs text-slate-600 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {record.location || 'N/A'}
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-[4px] text-[9px] font-black uppercase ${
                  record.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' :
                  record.status === 'LATE' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {record.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}