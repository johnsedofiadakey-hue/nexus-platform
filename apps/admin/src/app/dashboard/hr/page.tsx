"use client";

import React, { useEffect, useState } from "react";
import {
  Users, UserPlus, Mail, ChevronRight, Loader2, Navigation, Search,
  Shield, Activity, UserCircle, RefreshCcw, MapPin, Download, Calendar
} from "lucide-react";
import Link from "next/link";

export default function TeamPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [strictStatus, setStrictStatus] = useState({ onSite: 0, offSite: 0, totalOnSiteHours: "0h 0m" });
  const [strictStatusByUserId, setStrictStatusByUserId] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [registryDate, setRegistryDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [registryFrom, setRegistryFrom] = useState(() => new Date().toISOString().split("T")[0]);
  const [registryTo, setRegistryTo] = useState(() => new Date().toISOString().split("T")[0]);

  const [fetchError, setFetchError] = useState(false);

  const formatHours = (seconds: number) => {
    const safeSeconds = Math.max(0, Number(seconds || 0));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const exportAttendanceRegistry = () => {
    const from = registryFrom || registryDate || new Date().toISOString().split("T")[0];
    const to = registryTo || registryDate || from;
    window.open(`/api/hr/attendance/export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, "_blank");
  };

  const setToday = () => {
    const today = new Date().toISOString().split("T")[0];
    setRegistryDate(today);
    setRegistryFrom(today);
    setRegistryTo(today);
  };

  const setThisWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const offsetToMonday = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - offsetToMonday);
    monday.setHours(0, 0, 0, 0);
    const from = monday.toISOString().split("T")[0];
    const to = now.toISOString().split("T")[0];
    setRegistryFrom(from);
    setRegistryTo(to);
    setRegistryDate(to);
  };

  const setThisMonth = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const from = monthStart.toISOString().split("T")[0];
    const to = now.toISOString().split("T")[0];
    setRegistryFrom(from);
    setRegistryTo(to);
    setRegistryDate(to);
  };

  const fetchStaff = async (retryCount = 0) => {
    try {
      setFetchError(false);
      const [res, agentsRes] = await Promise.all([
        fetch(`/api/hr/team/list?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        }),
        fetch(`/api/dashboard/agents?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        }),
      ]);

      if (!res.ok) {
        // Server returned error — retry if transient (503 = pool desync)
        if ((res.status === 503 || res.status >= 500) && retryCount < 2) {
          console.warn(`Team fetch failed (${res.status}), retrying in ${(retryCount + 1) * 800}ms...`);
          await new Promise(r => setTimeout(r, (retryCount + 1) * 800));
          return fetchStaff(retryCount + 1);
        }
        throw new Error(`Server error ${res.status}`);
      }

      const data = await res.json();
      const inner = data?.data ?? data;
      const staffList = Array.isArray(inner) ? inner : (inner?.items ?? []);

      const agentsOnly = staffList.filter((user: any) =>
        ['PROMOTER', 'AGENT', 'WORKER', 'ASSISTANT'].includes(user.role)
      );

      setStaff(agentsOnly);

      if (agentsRes.ok) {
        const agentsPayload = await agentsRes.json();
        const list = agentsPayload?.data ?? agentsPayload ?? [];
        const agents = Array.isArray(list) ? list : [];
        const onSite = agents.filter((agent: any) => agent.attendanceStatus === 'ON_SITE').length;
        const offSite = agents.length - onSite;
        const totalSeconds = agents.reduce((sum: number, agent: any) => sum + Number(agent.totalOnSiteSecondsToday || 0), 0);
        setStrictStatus({ onSite, offSite, totalOnSiteHours: formatHours(totalSeconds) });

        const statusMap = agents.reduce((acc: Record<string, string>, agent: any) => {
          if (agent?.id) {
            acc[agent.id] = agent.attendanceStatus === 'ON_SITE' ? 'ON_SITE' : 'OFF_SITE';
          }
          return acc;
        }, {});
        setStrictStatusByUserId(statusMap);
      }
    } catch (e) {
      console.error("System Error: Team data unavailable.", e);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;

  const enhancedStaff = staff.map(person => ({
    ...person,
    isOnline: person.lastSeen ? new Date(person.lastSeen).getTime() > fiveMinutesAgo : false
  }));

  const filteredStaff = enhancedStaff.filter(person =>
    person.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: enhancedStaff.length,
    online: enhancedStaff.filter(s => s.isOnline).length,
    offline: enhancedStaff.filter(s => !s.isOnline).length,
    activePercent: enhancedStaff.length > 0
      ? Math.round((enhancedStaff.filter(s => s.isOnline).length / enhancedStaff.length) * 100)
      : 0
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

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Personnel Command</h1>
          <p className="text-slate-500 font-medium text-sm">Manage field promoters, grant permissions, and monitor activity.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 h-11 shadow-sm">
            <Calendar size={14} className="text-slate-400" />
            <input
              type="date"
              value={registryDate}
              onChange={(e) => setRegistryDate(e.target.value)}
              className="text-[11px] font-bold text-slate-700 bg-transparent outline-none"
            />
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 h-11 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">From</span>
            <input
              type="date"
              value={registryFrom}
              onChange={(e) => setRegistryFrom(e.target.value)}
              className="text-[11px] font-bold text-slate-700 bg-transparent outline-none"
            />
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 h-11 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">To</span>
            <input
              type="date"
              value={registryTo}
              onChange={(e) => setRegistryTo(e.target.value)}
              className="text-[11px] font-bold text-slate-700 bg-transparent outline-none"
            />
          </div>
          <button
            onClick={setToday}
            className="h-11 px-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            Today
          </button>
          <button
            onClick={setThisWeek}
            className="h-11 px-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            This Week
          </button>
          <button
            onClick={setThisMonth}
            className="h-11 px-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            This Month
          </button>
          <button
            onClick={exportAttendanceRegistry}
            className="h-11 px-5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={14} /> Export Registry
          </button>
          <Link
            href="/dashboard/hr/enrollment"
            className="h-11 px-6 bg-slate-900 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest flex items-center gap-3 hover:bg-blue-600 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
          >
            <UserPlus size={16} /> Recruit Promoter
          </Link>
        </div>
      </div>

      {/* ERROR RETRY BANNER */}
      {fetchError && (
        <div className="mb-8 bg-rose-50 border border-rose-200 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-rose-900">Connection Issue</h3>
            <p className="text-xs text-rose-600 mt-1">Could not load team data. This is usually temporary.</p>
          </div>
          <button
            onClick={() => { setLoading(true); fetchStaff(); }}
            className="h-10 px-5 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center gap-2"
          >
            <RefreshCcw size={14} /> Retry Now
          </button>
        </div>
      )}

      {/* ============================================= */}
      {/* PERSONNEL ROSTER                                */}
      {/* ============================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCard label="Total Force" value={stats.total} icon={Users} color="text-blue-600" bg="bg-blue-50" />
            <StatCard label="Online Now" value={stats.online} icon={Navigation} color="text-emerald-600" bg="bg-emerald-50" pulse />
            <StatCard label="Offline Units" value={stats.offline} icon={Shield} color="text-slate-400" bg="bg-slate-50" />
            <StatCard label="Field Health" value={`${stats.activePercent}%`} icon={Activity} color="text-indigo-600" bg="bg-indigo-50" />
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={16} className="text-blue-600" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Strict Status View</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">On Site</p>
                <p className="text-2xl font-black text-emerald-700 mt-1">{strictStatus.onSite}</p>
              </div>
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">Off Site</p>
                <p className="text-2xl font-black text-rose-700 mt-1">{strictStatus.offSite}</p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Total On-Site Hours</p>
                <p className="text-2xl font-black text-blue-700 mt-1">{strictStatus.totalOnSiteHours}</p>
              </div>
            </div>
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStaff.length === 0 ? (
              <div className="col-span-full py-32 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                  <Users className="w-6 h-6 text-slate-300" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">No Records Found</h3>
              </div>
            ) : (
              filteredStaff.map((person) => (
                <div
                  key={person.id}
                  className="group bg-white rounded-3xl border border-slate-200 p-1 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col"
                >
                  <div className="p-6 pb-0 flex-1">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-2">
                        <div className={`pl-2 pr-3 py-1 rounded-full flex items-center gap-2 border ${person.isOnline ? 'bg-emerald-50 border-emerald-100/50 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                          <div className={`w-2 h-2 rounded-full ${person.isOnline ? 'bg-emerald-500 animate-pulse ring-4 ring-emerald-100' : 'bg-slate-300'}`} />
                          <span className="text-[9px] font-black uppercase tracking-widest">
                            {person.isOnline ? 'Live' : 'Offline'}
                          </span>
                        </div>
                        <Link
                          href={`/dashboard/hr/member/${person.id}`}
                          className={`pl-2 pr-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity ${strictStatusByUserId[person.id] === 'ON_SITE' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}
                        >
                          {strictStatusByUserId[person.id] === 'ON_SITE' ? 'ON_SITE' : 'OFF_SITE'}
                        </Link>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto bg-slate-100 rounded-2xl mb-4 overflow-hidden border-2 border-white shadow-lg group-hover:scale-110 transition-transform duration-500">
                        {person.image ? (
                          <img src={person.image} className="w-full h-full object-cover" alt={person.name} />
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
                        <div className="flex items-center gap-3 text-xs">
                          <Navigation size={12} className={person.shop?.name ? "text-blue-500" : "text-slate-400"} />
                          <span className={`truncate font-bold ${person.shop?.name ? 'text-blue-600' : 'text-slate-400'}`}>
                            {person.shop?.name || "Unassigned"}
                          </span>
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
              ))
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
