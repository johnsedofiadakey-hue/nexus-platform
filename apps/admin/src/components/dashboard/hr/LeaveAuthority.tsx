"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Calendar } from "lucide-react";
import { toast } from "react-hot-toast";

export default function LeaveAuthority() {
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    const res = await fetch('/api/hr/leaves/pending'); // You'll need to ensure this API exists later
    if (res.ok) setRequests(await res.json());
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleDecision = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    await fetch(`/api/hr/leaves/manage`, {
        method: 'POST',
        body: JSON.stringify({ id, status })
    });
    toast.success(`Request ${status}`);
    fetchRequests();
  };

  if (requests.length === 0) return null; // Hide if no pending requests

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm mb-6 animate-in slide-in-from-top-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
            <Clock className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-black text-slate-900 uppercase">Pending Approvals</h3>
      </div>
      
      <div className="space-y-3">
        {requests.map((req: any) => (
            <div key={req.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                    <h4 className="text-xs font-black text-slate-900">{req.user.name}</h4>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 mt-1 uppercase">
                        <span className="bg-white border px-1 rounded">{req.type}</span>
                        <span>{new Date(req.startDate).toLocaleDateString()} — {new Date(req.endDate).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => handleDecision(req.id, 'APPROVED')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"><CheckCircle className="w-5 h-5" /></button>
                    <button onClick={() => handleDecision(req.id, 'REJECTED')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-500 hover:text-white transition-all"><XCircle className="w-5 h-5" /></button>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}