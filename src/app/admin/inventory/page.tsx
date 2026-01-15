"use client";

import React, { useState } from 'react';
import { Package, Truck, ArrowRight, Store, AlertCircle, Plus, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/sentinel';
import { toast } from 'react-hot-toast';

export default function InventoryHub() {
  const [selectedShop, setSelectedShop] = useState("");
  
  // Mock HQ Data
  const hqStock = [
    { id: 'p1', name: 'Nexus Smartphone Gen 2', sku: 'NX-PH-02', total: 450, price: 1200 },
    { id: 'p2', name: 'Nexus Power Vault', sku: 'NX-PW-01', total: 120, price: 450 },
  ];

  // Mock Shops
  const shops = [
    { id: 's1', name: 'Accra Mall Branch' },
    { id: 's2', name: 'Kumasi City Center' },
    { id: 's3', name: 'Takoradi Harbor Shop' },
  ];

  const handleDeployment = () => {
    if (!selectedShop) return toast.error("Please select a target shop");
    
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Authorizing Stock Transfer...',
        success: 'Deployment Successful. Shop inventory updated.',
        error: 'Transfer failed. Check HQ stock levels.',
      }
    );
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900">INVENTORY HUB</h1>
          <p className="text-slate-500 font-medium">Master Stock Control & Deployment</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all">
          <Plus size={20} /> ADD NEW MASTER PRODUCT
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* HQ MASTER STOCK */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black flex items-center gap-2">
                <Package className="text-blue-600" /> HQ MASTER WAREHOUSE
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input className="bg-slate-50 border-none rounded-xl py-2 pl-10 pr-4 text-xs" placeholder="Search SKU..." />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-50">
              <table className="w-full">
                <thead className="bg-slate-50 text-left text-[10px] uppercase font-bold text-slate-400">
                  <tr>
                    <th className="p-4">Product / SKU</th>
                    <th className="p-4">Global Stock</th>
                    <th className="p-4">Unit Price</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {hqStock.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{item.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">{item.sku}</p>
                      </td>
                      <td className="p-4 font-black text-blue-600">{item.total} Units</td>
                      <td className="p-4 font-medium text-slate-600">{formatCurrency(item.price)}</td>
                      <td className="p-4">
                        <button className="text-blue-600 text-xs font-black hover:underline underline-offset-4">EDIT</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* DEPLOYMENT CONTROL (The Engine) */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
              <Truck className="text-blue-400" /> QUICK DEPLOY
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Target Destination</label>
                <select 
                  className="w-full bg-slate-800 border-none rounded-xl py-4 px-4 text-sm focus:ring-2 focus:ring-blue-500"
                  value={selectedShop}
                  onChange={(e) => setSelectedShop(e.target.value)}
                >
                  <option value="">Select Shop...</option>
                  {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Product To Move</label>
                <select className="w-full bg-slate-800 border-none rounded-xl py-4 px-4 text-sm focus:ring-2 focus:ring-blue-500">
                  {hqStock.map(p => <option key={p.id} value={p.id}>{p.name} ({p.total} available)</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Quantity</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-800 border-none rounded-xl py-4 px-4 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex items-start gap-3">
                <AlertCircle className="text-blue-400 shrink-0" size={18} />
                <p className="text-[10px] leading-relaxed text-blue-100">
                  Moving stock will immediately reduce HQ inventory and increase the selected shop's available inventory. This action is irreversible once logged.
                </p>
              </div>

              <button 
                onClick={handleDeployment}
                className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-900/40"
              >
                DEPLOY TO SHOP <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase mb-4 tracking-widest">Recent Deployments</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                  <ArrowRight size={14} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">50 Units → Accra Mall</p>
                  <p className="text-[10px] text-slate-400">2 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}