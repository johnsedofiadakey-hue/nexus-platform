"use client";

import React, { useState } from "react";
import { 
  Package, Layers, Plus, Search, Filter, 
  ChevronRight, ArrowUpRight, Monitor, Refrigerator, 
  Wind, Zap, Trash2, Edit3, Save, Database
} from "lucide-react";

export default function InventoryTerminal() {
  const [activeView, setActiveView] = useState("STOCK"); // STOCK or CATEGORIES
  
  return (
    <div className="p-8 max-w-[1700px] mx-auto animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Inventory Grid</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">Global SKU Management & Taxonomy</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-200">
          <button 
            onClick={() => setActiveView("STOCK")}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'STOCK' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'}`}
          >
            Stock Levels
          </button>
          <button 
            onClick={() => setActiveView("CATEGORIES")}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'CATEGORIES' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'}`}
          >
            Categories
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        {/* LEFT COLUMN (8): MAIN WORKSPACE */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {activeView === "STOCK" ? (
            <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="relative w-72">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input placeholder="SEARCH SKUs..." className="w-full bg-white border border-slate-200 pl-12 pr-4 py-2.5 rounded-xl text-[10px] font-black uppercase outline-none focus:border-blue-500" />
                </div>
                <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
                  <Plus className="w-4 h-4" /> Add New SKU
                </button>
              </div>

              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">LG Product Description</th>
                    <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Sub-Category</th>
                    <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Hub Location</th>
                    <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Units</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[11px] font-bold text-slate-700 uppercase">
                  {[
                    { name: "OLED65C3 Smart TV", cat: "TV", hub: "Accra Mall", qty: 12, status: 'GOOD' },
                    { name: "InstaView Refrigerator", cat: "FRIDGE", hub: "Kumasi Mall", qty: 3, status: 'LOW' },
                    { name: "Dual Inverter AC 1.5HP", cat: "AIR CON", hub: "Palace Labone", qty: 45, status: 'GOOD' }
                  ].map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-all">
                      <td className="px-8 py-6 text-slate-900 font-black tracking-tight">{item.name}</td>
                      <td className="px-6 py-6"><span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[9px]">{item.cat}</span></td>
                      <td className="px-6 py-6">{item.hub}</td>
                      <td className="px-6 py-6 text-right tabular-nums">
                        <span className={item.qty < 5 ? "text-red-500" : "text-slate-900"}>{item.qty}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {/* CATEGORY EDITOR */}
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-slate-400 flex justify-between">
                   Primary Categories <Layers className="w-4 h-4" />
                 </h3>
                 <div className="space-y-3">
                    {["HOME APPLIANCE", "HOME ENTERTAINMENT"].map(cat => (
                      <div key={cat} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group">
                         <span className="text-xs font-black tracking-tight">{cat}</span>
                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button className="p-2 bg-white rounded-lg border border-slate-200"><Edit3 className="w-3.5 h-3.5 text-slate-400" /></button>
                            <button className="p-2 bg-white rounded-lg border border-slate-200 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                         </div>
                      </div>
                    ))}
                    <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-all">
                      + Add Global Category
                    </button>
                 </div>
              </div>

              {/* SUB-CATEGORY EDITOR */}
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-slate-400 flex justify-between">
                   Sub-Category Logic <Database className="w-4 h-4" />
                 </h3>
                 <div className="space-y-2 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                    {["AIR CONDITION", "REFRIGERATOR", "FREEZER", "MICROWAVE", "WASHING MACHINE", "TV", "AUDIO"].map(sub => (
                      <div key={sub} className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between hover:border-blue-200">
                         <span className="text-[10px] font-bold text-slate-600 tracking-widest">{sub}</span>
                         <div className="text-[8px] font-black bg-slate-100 px-2 py-1 rounded">MODIFIABLE</div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (4): ANALYTICS & HUB STOCK */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
             <div className="relative z-10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-6">Stock Health by Hub</h3>
                <div className="space-y-4">
                   {[
                     { hub: "Melcom Accra Mall", health: 92, status: "Optimum" },
                     { hub: "Game Kumasi Mall", health: 64, status: "Check Stock" },
                     { hub: "Palace Labone", health: 88, status: "Optimum" }
                   ].map((node, i) => (
                     <div key={i} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                           <span>{node.hub}</span>
                           <span className={node.health < 70 ? "text-amber-400" : "text-emerald-400"}>{node.health}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                           <div className={`h-full rounded-full ${node.health < 70 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${node.health}%` }} />
                        </div>
                     </div>
                   ))}
                </div>
             </div>
             <Package className="absolute -right-6 -bottom-6 w-32 h-32 text-white/5 opacity-10" />
          </div>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Regional Distribution</h3>
             <div className="flex flex-col gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
                   <span className="text-[10px] font-black text-slate-500 uppercase">Accra Region</span>
                   <span className="text-sm font-black text-slate-900 tabular-nums">842 Units</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
                   <span className="text-[10px] font-black text-slate-500 uppercase">Ashanti Region</span>
                   <span className="text-sm font-black text-slate-900 tabular-nums">362 Units</span>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}