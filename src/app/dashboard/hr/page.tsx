"use client";

import React, { useEffect, useState } from "react";
import { 
  Users, UserPlus, Mail, Building2, 
  ChevronRight, Loader2, Navigation,
  SignalHigh, Search
} from "lucide-react";
import Link from "next/link";

export default function TeamPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStaff = async () => {
    try {
      // 🛰️ Refreshing live data with cache-busting
      const res = await fetch(`/api/hr/team/list?t=${Date.now()}`);
      const data = await res.json();
      const staffList = Array.isArray(data) ? data : (data.data || []);
      setStaff(staffList);
    } catch (e) {
      console.error("System Error: Team data currently unavailable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  if (loading) return (
    <div className="h-[70vh] flex flex-col items-center justify-center space-y-6">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">
        Loading Team Members...
      </div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto py-8 animate-in fade-in duration-700">
      
      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8 px-2">
        <div className="space-y-3">
          <h1 className="text-5xl font-black text-[#0F172A] tracking-tighter uppercase">Team</h1>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 bg-emerald-500 rounded-full" />
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">
               Total Active Members: <span className="text-[#0F172A]">{staff.length}</span>
            </p>
          </div>
        </div>
        
        <Link 
          href="/dashboard/hr/enrollment" 
          className="h-14 px-8 bg-[#0F172A] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-4 hover:bg-blue-600 transition-all shadow-xl active:scale-95"
        >
          <UserPlus size={16} /> Add New Member
        </Link>
      </div>

      {/* --- SEARCH & FILTERS BAR --- */}
      <div className="mb-10 px-2">
        <div className="relative max-w-md">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            className="w-full h-14 pl-12 pr-6 bg-white border border-slate-100 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* --- MEMBER GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {staff.length === 0 ? (
          <div className="col-span-full py-32 bg-white rounded-[2.5rem] border border-slate-100 text-center flex flex-col items-center justify-center shadow-sm">
             <Users className="w-12 h-12 text-slate-100 mb-6" />
             <h3 className="text-xl font-black text-[#0F172A] tracking-tight uppercase">No Members Found</h3>
             <p className="text-slate-400 font-bold max-w-xs mt-2 text-xs">The member directory is currently empty.</p>
          </div>
        ) : (
          staff.map((person) => {
            const isOnline = person.lastLat && person.lastLng;
            
            return (
              <div 
                key={person.id} 
                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group"
              >
                <div className="p-8">
                  {/* Status Header */}
                  <div className="flex justify-between items-start mb-8">
                    <div className={`px-3 py-1.5 rounded-xl flex items-center gap-2 border ${isOnline ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        {isOnline ? 'Active' : 'Offline'}
                      </span>
                    </div>
                    <div className="p-2 text-slate-300 group-hover:text-blue-500 transition-colors">
                      <Navigation size={14} />
                    </div>
                  </div>

                  {/* Member Photo & Bio */}
                  <div className="flex flex-col items-center text-center mb-10">
                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center border-4 border-white shadow-lg overflow-hidden mb-5">
                      {person.image ? (
                        <img src={person.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-black text-slate-300">{person.name.charAt(0)}</span>
                      )}
                    </div>
                    <h3 className="font-black text-[#0F172A] text-lg tracking-tighter uppercase leading-none">{person.name}</h3>
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mt-2 bg-blue-50 px-3 py-1 rounded-lg">
                      {person.role?.replace('_', ' ')}
                    </p>
                  </div>
                  
                  {/* Assignments & Contact */}
                  <div className="space-y-3 mb-10">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:border-blue-100 transition-colors">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">Assigned Store</p>
                      <span className="text-xs font-black text-[#0F172A] uppercase truncate block">
                        {person.shop?.name || "Not Assigned"}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 px-2 text-slate-400">
                      <Mail size={12} />
                      <span className="text-[10px] font-bold truncate tracking-tight">{person.email}</span>
                    </div>
                  </div>

                  {/* Navigation Action */}
                  <Link 
                    href={`/dashboard/hr/member/${person.id}`} 
                    className="w-full py-4 bg-[#0F172A] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg"
                  >
                    View Details <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}