"use client";

import React, { useState } from 'react';
import { Banknote, Receipt, Car, Fuel, Plus, Send, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function StaffExpenses() {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Transport");
  const [desc, setDesc] = useState("");

  const categories = [
    { name: 'Transport', icon: Car },
    { name: 'Fuel', icon: Fuel },
    { name: 'Marketing', icon: Send },
    { name: 'Miscellaneous', icon: Receipt },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Expense logged for Admin approval.");
    setAmount("");
    setDesc("");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24">
      <header className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Banknote className="text-emerald-600" /> EXPENSE LOG
        </h1>
        <p className="text-slate-500 text-xs italic">Submit costs for reimbursement</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-4">Select Category</label>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setCategory(cat.name)}
                className={`flex items-center gap-2 p-3 rounded-2xl border transition-all ${
                  category === cat.name 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                    : 'border-slate-100 bg-slate-50 text-slate-500'
                }`}
              >
                <cat.icon size={18} />
                <span className="text-xs font-bold">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="mb-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Amount (GHS)</label>
            <input 
              type="number"
              className="w-full text-3xl font-black text-slate-900 focus:outline-none"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Description / Reason</label>
            <textarea 
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. Fuel for delivery to Accra Mall..."
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              required
            />
          </div>
        </div>

        <button className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-lg">
          SUBMIT EXPENSE
        </button>
      </form>

      {/* History Preview */}
      <div className="mt-8">
        <h3 className="text-xs font-black text-slate-400 uppercase mb-4 flex items-center gap-2">
            <Clock size={14}/> Recent Submissions
        </h3>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 flex justify-between items-center">
            <div>
                <p className="font-bold text-sm text-slate-800">GHS 45.00</p>
                <p className="text-[10px] text-slate-500">Transport • Pending</p>
            </div>
            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[8px] font-black uppercase">Pending</span>
        </div>
      </div>
    </div>
  );
}