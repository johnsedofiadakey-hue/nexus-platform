"use client";

import React, { useEffect, useState } from "react";
import { 
  Users, UserPlus, Mail, ChevronRight, Loader2, Navigation, Search
} from "lucide-react";
import Link from "next/link";

export default function TeamPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchStaff = async () => {
    try {
      const res = await fetch(`/api/hr/team/list?t=${Date.now()}`);
      const data = await res.json();
      const staffList = Array.isArray(data) ? data : (data.data || []);
      
      // 🛡️ LOGIC FIX: Exclude ADMIN accounts. Show only Agents/Managers.
      const agentsOnly = staffList.filter((user: any) => user.role !== 'ADMIN');
      
      setStaff(agentsOnly);
    } catch (e) {
      console.error("System Error: Team data unavailable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  // Filter Logic for Search Bar
  const filteredStaff = staff.filter(person => 
    person.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    person.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="h-[70vh] flex flex-col items-center justify-center space-y-6">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">
        Loading Field Agents...
      </div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto py-8 animate-in fade-in duration-700 font-sans">
      
      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8 px-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase">Field Force</h1>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 bg-emerald-500 rounded-full" />
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
               Active Personnel: <span className="text-[#0F172A]">{staff.length}</span>
            </p>
          </div>
        </div>
        
        <Link 
          href="/dashboard/hr/enrollment" 
          className="h-12 px-8 bg-[#0F172A] text-white rounded-xl font-bold text-[11px] uppercase tracking-widest flex items-center gap-3 hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl active:scale-95"
        >
          <UserPlus size={16} /> Enroll Agent
        </Link>
      </div>

      {/* --- SEARCH BAR --- */}
      <div className="mb-10 px-4">
        <div className="relative max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search personnel directory..." 
            className="w-full h-14 pl-12 pr-6 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* --- MEMBER GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4">
        {filteredStaff.length === 0 ? (
          <div className="col-span-full py-40 bg-white rounded-[2rem] border border-dashed border-slate-200 text-center flex flex-col items-center justify-center">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-slate-300" />
             </div>
             <h3 className="text-lg font-bold text-[#0F172A] uppercase tracking-tight">Directory Empty</h3>
             <p className="text-slate-400 text-xs font-medium mt-1">No matching personnel found.</p>
          </div>
        ) : (
          filteredStaff.map((person) => {
            const isOnline = person.lastLat && person.lastLng;
            
            return (
              <div 
                key={person.id} 
                className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
              >
                <div className="p-6">
                  {/* Status Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 border ${isOnline ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                      <span className="text-[9px] font-bold uppercase tracking-widest">
                        {isOnline ? 'Live' : 'Offline'}
                      </span>
                    </div>
                    {/* Role Badge */}
                    <span className="px-2 py-1 rounded text-[9px] font-bold uppercase bg-blue-50 text-blue-600 border border-blue-100">
                        {person.role === 'WORKER' ? 'Agent' : person.role}
                    </span>
                  </div>

                  {/* Identity */}
                  <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-24 h-24 bg-slate-50 rounded-[1.5rem] flex items-center justify-center border-4 border-white shadow-lg overflow-hidden mb-4 relative group-hover:scale-105 transition-transform">
                      {person.image ? (
                        <img src={person.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-black text-slate-300">{person.name.charAt(0)}</span>
                      )}
                    </div>
                    <h3 className="font-bold text-[#0F172A] text-lg leading-tight mb-1">{person.name}</h3>
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                        <Mail size={10} />
                        <span className="truncate max-w-[150px]">{person.email}</span>
                    </div>
                  </div>
                  
                  {/* Assignment Card */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6 group-hover:border-blue-100 transition-colors">
                    <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                        <Navigation size={10} /> Assigned Hub
                    </p>
                    <span className="text-xs font-bold text-[#0F172A] uppercase truncate block">
                      {person.shop?.name || "Unassigned"}
                    </span>
                  </div>

                  {/* Action */}
                  <Link 
                    href={`/dashboard/hr/member/${person.id}`} 
                    className="w-full py-3.5 bg-[#0F172A] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-md hover:shadow-lg"
                  >
                    Open Portal <ChevronRight size={14} />
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