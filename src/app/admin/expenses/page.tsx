"use client";

import React from 'react';
import { Check, X, FileText, AlertCircle, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/sentinel';

export default function AdminExpenseManager() {
  const pendingExpenses = [
    { id: '1', staff: 'Kwame Mensah', shop: 'Accra Mall', amount: 150, category: 'Fuel', date: '2026-01-13' },
    { id: '2', staff: 'Abena Selorm', shop: 'Kumasi Hub', amount: 25, category: 'Transport', date: '2026-01-13' },
  ];

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
          <TrendingDown className="text-rose-500" /> EXPENSE APPROVALS
        </h1>
        <p className="text-slate-500 font-medium">Review and authorize field operational costs</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {pendingExpenses.map((expense) => (
          <div key={expense.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="font-black text-slate-900">{expense.staff}</h3>
                <p className="text-xs text-slate-500 font-bold uppercase">{expense.shop} • {expense.category}</p>
              </div>
            </div>

            <div className="flex flex-col md:items-end">
              <p className="text-2xl font-black text-slate-900">{formatCurrency(expense.amount)}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">{expense.date}</p>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 md:flex-none bg-rose-50 text-rose-600 px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-rose-100 transition-all">
                <X size={16} /> REJECT
              </button>
              <button className="flex-1 md:flex-none bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
                <Check size={16} /> APPROVE
              </button>
            </div>
          </div>
        ))}

        {pendingExpenses.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="font-bold text-slate-400">No pending expenses found.</p>
          </div>
        )}
      </div>
    </div>
  );
}