"use client";

import React from "react";
import { Calendar, Clock } from "lucide-react";

interface LeaveRecord {
  id: string;
  startDate: string;
  endDate: string;
  type: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  reason?: string;
}

interface LeaveHistoryTableProps {
  leaveRecords: LeaveRecord[];
}

export default function LeaveHistoryTable({ leaveRecords }: LeaveHistoryTableProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mt-8">
      <div className="p-6 border-b border-slate-100 bg-blue-50/30">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-500" /> Leave History & Status
        </h3>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Period</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Type</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Status</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Reason</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {leaveRecords?.map((leave) => (
            <tr key={leave.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                </div>
              </td>
              <td className="px-6 py-4 text-xs font-bold text-slate-700 uppercase">
                {leave.type}
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-[4px] text-[9px] font-black uppercase ${
                  leave.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                  leave.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {leave.status}
                </span>
              </td>
              <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">
                {leave.reason || 'No reason provided'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}