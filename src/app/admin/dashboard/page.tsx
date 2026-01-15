"use client";

import React from 'react';
import { 
  TrendingUp, Users, Store, AlertTriangle, 
  ArrowUpRight, ArrowDownRight, Package, 
  Clock, Activity, ChevronRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';

// Mock Data for Analytics Engine
const salesData = [
  { name: '08:00', sales: 4000 },
  { name: '10:00', sales: 7500 },
  { name: '12:00', sales: 12000 },
  { name: '14:00', sales: 9000 },
  { name: '16:00', sales: 15000 },
  { name: '18:00', sales: 11000 },
];

const shopPerformance = [
  { name: 'Accra Mall', revenue: 45000, color: '#3b82f6' },
  { name: 'Kumasi Hub', revenue: 32000, color: '#10b981' },
  { name: 'Takoradi', revenue: 12000, color: '#f59e0b' },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-[#f8fafc] p-8">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">NEXUS COMMAND</h1>
          <p className="text-slate-500 font-medium mt-1">Global Retail Intelligence & Field Operations</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
            <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl">
                <Activity size={20} />
            </div>
            <div className="pr-4">
                <p className="text-[10px] font-black text-slate-400 uppercase">System Status</p>
                <p className="text-sm font-bold text-slate-700">All Spoke Sites Online</p>
            </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard title="Today's Revenue" value="GHS 54,200" trend="+12.5%" icon={TrendingUp} color="blue" />
        <StatCard title="Active Staff" value="48 / 52" trend="+2" icon={Users} color="emerald" />
        <StatCard title="Inventory Value" value="GHS 1.2M" trend="-2%" icon={Package} color="purple" />
        <StatCard title="Ghost Alerts" value="2" trend="Critical" icon={AlertTriangle} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Sales Chart */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Clock className="text-blue-600" size={20} /> INTRADAY SALES VELOCITY
            </h3>
            <select className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold text-slate-500">
                <option>Today</option>
                <option>Yesterday</option>
            </select>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                <YAxis hide />
                <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                    cursor={{stroke: '#3b82f6', strokeWidth: 2}}
                />
                <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shop Performance Sidebar */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
          <h3 className="text-xl font-black text-slate-900 mb-8">TOP SPOKES</h3>
          <div className="space-y-6">
            {shopPerformance.map((shop, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="flex justify-between items-end mb-2">
                  <span className="font-bold text-slate-700">{shop.name}</span>
                  <span className="text-xs font-black text-blue-600">GHS {shop.revenue.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 group-hover:brightness-110" 
                    style={{ width: `${(shop.revenue / 50000) * 100}%`, backgroundColor: shop.color }} 
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 p-6 bg-slate-900 rounded-[2rem] text-white">
            <p className="text-[10px] font-black text-blue-400 uppercase mb-2">Efficiency Tip</p>
            <p className="text-xs font-medium leading-relaxed opacity-80">
              Kumasi Hub conversion is up by 14% today. Consider deploying more stock to match the demand velocity.
            </p>
            <button className="mt-4 flex items-center gap-2 text-xs font-black hover:gap-3 transition-all">
                GO TO DEPLOYMENT <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Live Activity & Ghost Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-lg border border-slate-100">
            <h3 className="text-lg font-black text-slate-900 mb-6">REAL-TIME SENTINEL FEED</h3>
            <div className="space-y-6">
                <ActivityItem user="Kwame Mensah" action="Sale Processed" meta="GHS 450.00" time="Just now" type="success" />
                <ActivityItem user="Abena Selorm" action="Off-Site Alert" meta="Distance: 450m" time="2 mins ago" type="alert" />
                <ActivityItem user="John Doe" action="Inventory Log" meta="+50 Units Received" time="15 mins ago" type="neutral" />
            </div>
        </div>
        
        <div className="bg-rose-50 rounded-[2.5rem] p-8 border border-rose-100">
            <h3 className="text-lg font-black text-rose-900 mb-6 flex items-center gap-2">
                <AlertTriangle size={20} /> GHOST MODE DETECTED
            </h3>
            <div className="space-y-4">
                <div className="bg-white/60 p-5 rounded-3xl flex justify-between items-center">
                    <div>
                        <p className="font-black text-rose-950">Takoradi Harbor Shop</p>
                        <p className="text-xs font-medium text-rose-700">Zero sales for 6 hours</p>
                    </div>
                    <button className="bg-rose-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Intervene</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components for cleaner structure
function StatCard({ title, value, trend, icon: Icon, color }: any) {
    const colorClasses: any = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100',
        rose: 'bg-rose-50 text-rose-600 border-rose-100'
    };

    return (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border ${colorClasses[color]}`}>
                <Icon size={28} />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <div className="flex items-baseline gap-2 mt-2">
                <h2 className="text-3xl font-black text-slate-900">{value}</h2>
                <span className={`text-xs font-black flex items-center ${trend.includes('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {trend.includes('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {trend}
                </span>
            </div>
        </div>
    );
}

function ActivityItem({ user, action, meta, time, type }: any) {
    return (
        <div className="flex justify-between items-center group">
            <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${type === 'success' ? 'bg-emerald-500' : type === 'alert' ? 'bg-rose-500' : 'bg-blue-500'}`} />
                <div>
                    <p className="text-sm font-black text-slate-800">{user}</p>
                    <p className="text-xs font-medium text-slate-400">{action} • <span className="font-bold">{meta}</span></p>
                </div>
            </div>
            <span className="text-[10px] font-bold text-slate-300 group-hover:text-slate-500 transition-colors">{time}</span>
        </div>
    );
}