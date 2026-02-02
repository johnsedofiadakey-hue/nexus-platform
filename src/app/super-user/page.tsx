"use client";

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Lock, Unlock, Globe, Activity, Database, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

export default function SuperUserControl() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const res = await fetch('/api/super/tenants');
      if (res.ok) {
        setTenants(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleLock = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    // Optimistic Update
    setTenants(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));

    // TODO: Call API to persist
    toast(
      `Tenant ${newStatus === 'LOCKED' ? 'Deactivated' : 'Reactivated'}`,
      { icon: newStatus === 'LOCKED' ? '🔒' : '🔓', style: { borderRadius: '10px', background: '#000', color: '#fff' } }
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-10">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white flex items-center gap-3">
              <Zap className="text-blue-500 fill-blue-500" /> STORMGLIDE COMMAND
            </h1>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mt-1">NEXUS Platform Global Controller</p>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-500">PLATFORM LOAD</p>
              <p className="text-xs font-mono text-emerald-400">0.04ms Latency</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl">
            <Globe className="text-blue-500 mb-4" />
            <p className="text-3xl font-black text-white">{tenants.length}</p>
            <p className="text-xs font-bold text-slate-500 uppercase">Active Tenants</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl">
            <Activity className="text-emerald-500 mb-4" />
            <p className="text-3xl font-black text-white">
              {tenants.reduce((acc, t) => acc + (t.users || 0), 0)}
            </p>
            <p className="text-xs font-bold text-slate-500 uppercase">Total Active Staff</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl">
            <Database className="text-purple-500 mb-4" />
            <p className="text-3xl font-black text-white">99.9%</p>
            <p className="text-xs font-bold text-slate-500 uppercase">System Uptime</p>
          </div>
        </div>

        <div className="bg-slate-900/30 border border-slate-800 rounded-[2.5rem] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-900/50">
              <tr className="text-[10px] uppercase font-black text-slate-500 tracking-widest">
                <th className="px-8 py-5">Tenant Name</th>
                <th className="px-8 py-5">Infrastructure</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Master Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">Connecting to Neural Net...</td></tr>
              ) : tenants.map(tenant => (
                <tr key={tenant.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-8 py-6">
                    <p className="text-lg font-black text-white">{tenant.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                      {tenant.id}
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{tenant.plan}</span>
                    </p>
                  </td>
                  <td className="px-8 py-6 text-sm">
                    <p className="font-bold text-slate-300">{tenant.shops} Shops</p>
                    <p className="text-slate-500">{tenant.users} Active Staff</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black ${tenant.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Button
                      variant={tenant.status === 'ACTIVE' ? "destructive" : "secondary"}
                      size="sm"
                      onClick={() => toggleLock(tenant.id, tenant.status)}
                      className="gap-2"
                    >
                      {tenant.status === 'ACTIVE' ? <Lock size={14} /> : <Unlock size={14} />}
                      {tenant.status === 'ACTIVE' ? "KILL SWITCH" : "ACTIVATE"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}