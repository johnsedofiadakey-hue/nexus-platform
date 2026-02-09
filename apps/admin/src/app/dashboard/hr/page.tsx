"use client";

import React, { useEffect, useState } from "react";
import {
  Users, UserPlus, Mail, ChevronRight, Loader2, Navigation, Search,
  Shield, Activity, UserCircle
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

      // 🛡️ LOGIC FIX: Strictly show field personnel (PROMOTERS & AGENTS)
      // Administrative staff should not appear in this roster.
      const agentsOnly = staffList.filter((user: any) =>
        user.role === 'PROMOTER' || user.role === 'AGENT' || user.role === 'WORKER'
      );

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

  // Stats Calculation
  const stats = {
    total: staff.length,
    online: staff.filter(s => s.lastLat && s.lastLng).length,
    managers: staff.filter(s => s.role === 'MANAGER').length,
    active: staff.filter(s => s.status === 'ACTIVE').length
  };

  if (loading) return (
    <div className="h-[70vh] flex flex-col items-center justify-center space-y-6">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">
        Acquiring Roster...
      </div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto py-10 px-8 animate-in fade-in duration-700 font-sans pb-20">

      {/* 📊 MISSION CONTROL HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Personnel Command</h1>
          <p className="text-slate-500 font-medium text-sm">Manage field promoters, grant permissions, and monitor activity.</p>
        </div>

        <Link
          href="/dashboard/hr/enrollment"
          className="h-11 px-6 bg-slate-900 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest flex items-center gap-3 hover:bg-blue-600 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
        >
          <UserPlus size={16} /> Recruit Promoter
        </Link>
      </div>

      {/* 📈 STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard label="Total Force" value={stats.total} icon={Users} color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="Online Promoters" value={stats.online} icon={Navigation} color="text-emerald-600" bg="bg-emerald-50" pulse />
        <StatCard label="Managers" value={stats.managers} icon={Shield} color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard label="Active Status" value={`${Math.round((stats.active / (stats.total || 1)) * 100)}%`} icon={Activity} color="text-slate-600" bg="bg-slate-50" />
      </div>

      {/* 🔍 FILTER & SEARCH */}
      <div className="mb-8 flex items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-sm max-w-lg">
        <div className="w-12 h-12 flex items-center justify-center text-slate-400">
          <Search size={20} />
        </div>
        <input
          type="text"
          placeholder="Filter by name or email..."
          className="flex-1 h-full bg-transparent text-sm font-medium outline-none text-slate-700 placeholder:text-slate-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* 📇 ROSTER GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredStaff.length === 0 ? (
          <div className="col-span-full py-32 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-100">
              <Users className="w-6 h-6 text-slate-300" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">No Records Found</h3>
          </div>
        ) : (
          filteredStaff.map((person) => {
            const isOnline = person.lastLat && person.lastLng;

            return (
              <div
                key={person.id}
                className="group bg-white rounded-3xl border border-slate-200 p-1 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col"
              >
                <div className="p-6 pb-0 flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`pl-2 pr-3 py-1 rounded-full flex items-center gap-2 border ${isOnline ? 'bg-emerald-50 border-emerald-100/50 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse ring-4 ring-emerald-100' : 'bg-slate-300'}`} />
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        {isOnline ? 'Live' : 'Offline'}
                      </span>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto bg-slate-100 rounded-2xl mb-4 overflow-hidden border-2 border-white shadow-lg group-hover:scale-110 transition-transform duration-500">
                      {person.image ? (
                        <img src={person.image} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <UserCircle size={32} />
                        </div>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">{person.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">{person.role}</p>

                    <div className="bg-slate-50 rounded-xl p-3 mb-6 space-y-2 border border-slate-100">
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <Mail size={12} className="text-slate-400" />
                        <span className="truncate">{person.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <Navigation size={12} className="text-slate-400" />
                        <span className="truncate font-medium">{person.shop?.name || "Unassigned"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/dashboard/hr/member/${person.id}`}
                  className="mx-2 mb-2 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-blue-600 transition-colors"
                >
                  View Intel <ChevronRight size={12} />
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, pulse }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:scale-[1.02] transition-transform">
      <div className={`w-14 h-14 rounded-2xl ${bg} ${color} flex items-center justify-center ${pulse ? 'animate-pulse' : ''}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tight leading-none">{value}</p>
      </div>
    </div>
  );
}