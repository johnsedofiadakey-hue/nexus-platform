"use client";

import React, { useState } from 'react';
import { ClipboardCheck, Users, ShoppingBag, MessageSquare, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function DailyReportPage() {
  const [formData, setFormData] = useState({
    walkIns: 0,
    buyers: 0,
    notes: '',
  });

  // Business Logic: Auto-calculate conversion
  const conversionRate = formData.walkIns > 0 
    ? ((formData.buyers / formData.walkIns) * 100).toFixed(1) 
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, we call a Server Action here
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)), // Simulate API call
      {
        loading: 'Submitting Operational Intelligence...',
        success: 'Report Submitted. Accountability Logged.',
        error: 'Submission failed. Please check connection.',
      }
    );
  };

  return (
    <div className="min-h-screen bg-white p-6 pb-24">
      <header className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <ClipboardCheck className="text-blue-600" /> DAILY REPORT
        </h1>
        <p className="text-slate-500 text-sm italic">End-of-day operational summary</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Metric Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-2">
              <Users size={12} /> Walk-ins
            </label>
            <input 
              type="number" 
              className="w-full bg-transparent text-2xl font-black focus:outline-none"
              value={formData.walkIns}
              onChange={(e) => setFormData({...formData, walkIns: parseInt(e.target.value) || 0})}
            />
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-2">
              <ShoppingBag size={12} /> Buyers
            </label>
            <input 
              type="number" 
              className="w-full bg-transparent text-2xl font-black focus:outline-none text-emerald-600"
              value={formData.buyers}
              onChange={(e) => setFormData({...formData, buyers: parseInt(e.target.value) || 0})}
            />
          </div>
        </div>

        {/* Intelligence Card */}
        <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-100">
          <p className="text-xs font-bold opacity-70 uppercase mb-1">Conversion Performance</p>
          <h2 className="text-4xl font-black">{conversionRate}%</h2>
          <p className="text-[10px] mt-2 opacity-80 italic">*Calculated based on buyer/walk-in ratio</p>
        </div>

        {/* Narrative Input */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <MessageSquare size={16} className="text-blue-600" /> Operational Notes
          </label>
          <textarea 
            className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            placeholder="Complaints, objections, or trends observed today..."
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
          />
        </div>

        <button 
          type="submit"
          className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg"
        >
          <Send size={20} /> SUBMIT TO NEXUS HQ
        </button>
      </form>
    </div>
  );
}