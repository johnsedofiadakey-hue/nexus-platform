"use client";

import React, { useState } from "react";
import { Target, TrendingUp, Users, DollarSign, Package, Plus, Edit2, X, RefreshCcw } from "lucide-react";
import { toast } from "react-hot-toast";

interface AdminTargetWidgetProps {
  adminTarget: any;
  teamPerformance: {
    totalSales: number;
    totalQuantity: number;
    activeAgents: number;
  };
  onRefresh: () => void;
}

export default function AdminTargetWidget({ adminTarget, teamPerformance, onRefresh }: AdminTargetWidgetProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    targetValue: adminTarget?.targetValue || 50000,
    targetQuantity: adminTarget?.targetQuantity || 500,
    period: "MONTHLY"
  });

  const valueProgress = adminTarget && teamPerformance?.totalSales != null && adminTarget.targetValue
    ? Math.min((teamPerformance.totalSales / adminTarget.targetValue) * 100, 100)
    : 0;
  const quantityProgress = adminTarget && teamPerformance?.totalQuantity != null && adminTarget.targetQuantity
    ? Math.min((teamPerformance.totalQuantity / adminTarget.targetQuantity) * 100, 100)
    : 0;

  const handleCreateOrUpdate = async () => {
    setLoading(true);
    const t = toast.loading(adminTarget ? "Updating target..." : "Creating target...");

    try {
      const now = new Date();
      let end = new Date();
      if (formData.period === 'WEEKLY') end.setDate(now.getDate() + 7);
      else if (formData.period === 'MONTHLY') end.setMonth(now.getMonth() + 1);
      else if (formData.period === 'QUARTERLY') end.setMonth(now.getMonth() + 3);

      const method = adminTarget ? "PATCH" : "POST";
      const body: any = {
        targetValue: parseFloat(formData.targetValue.toString()),
        targetQuantity: parseInt(formData.targetQuantity.toString()),
        targetType: "ADMIN"
      };

      if (adminTarget) {
        body.targetId = adminTarget.id;
      } else {
        body.startDate = now;
        body.endDate = end;
      }

      const response = await fetch("/api/targets", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast.success(adminTarget ? "Target updated successfully" : "Target created successfully", { id: t });
        setShowModal(false);
        onRefresh();
      } else {
        throw new Error("Failed to save target");
      }
    } catch (error) {
      toast.error("Failed to save target", { id: t });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-200 px-5 py-3 bg-slate-50 flex justify-between items-center">
          <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-2">
            <Target size={14} className="text-indigo-600" /> Team Performance Target
          </h3>
          <button
            onClick={() => {
              if (adminTarget) {
                setFormData({
                  targetValue: adminTarget.targetValue,
                  targetQuantity: adminTarget.targetQuantity,
                  period: "MONTHLY"
                });
              }
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            {adminTarget ? <><Edit2 size={10} /> Edit</> : <><Plus size={10} /> Set Target</>}
          </button>
        </div>

        {/* Content */}
        {adminTarget ? (
          <div className="p-5 space-y-5">
            {/* Target Period */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Current Period</p>
                <p className="text-xs font-semibold text-slate-900 mt-1">
                  {new Date(adminTarget.startDate).toLocaleDateString()} - {new Date(adminTarget.endDate).toLocaleDateString()}
                </p>
              </div>
              <div className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${
                adminTarget.status === 'ACTIVE' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' :
                adminTarget.status === 'COMPLETED' ? 'bg-blue-50 border border-blue-200 text-blue-700' :
                'bg-slate-50 border border-slate-200 text-slate-700'
              }`}>
                {adminTarget.status}
              </div>
            </div>

            {/* Team Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200 p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Users size={10} className="text-slate-500" />
                  <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Active Promoters</p>
                </div>
                <p className="text-xl font-bold text-slate-900">{teamPerformance.activeAgents}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <DollarSign size={10} className="text-emerald-600" />
                  <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Team Sales</p>
                </div>
                <p className="text-xl font-bold text-emerald-600">₵{teamPerformance.totalSales.toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Package size={10} className="text-blue-600" />
                  <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Units Sold</p>
                </div>
                <p className="text-xl font-bold text-blue-600">{teamPerformance.totalQuantity}</p>
              </div>
            </div>

            {/* Revenue Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Revenue Target</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    ₵{teamPerformance.totalSales.toLocaleString()} <span className="text-slate-400">/ ₵{adminTarget.targetValue.toLocaleString()}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={12} className={valueProgress >= 100 ? 'text-emerald-600' : valueProgress >= 50 ? 'text-amber-600' : 'text-slate-400'} />
                  <p className={`text-sm font-bold ${valueProgress >= 100 ? 'text-emerald-600' : valueProgress >= 50 ? 'text-amber-600' : 'text-slate-900'}`}>
                    {(valueProgress || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="h-2 bg-slate-100 border border-slate-200 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    valueProgress >= 100 ? 'bg-emerald-500' :
                    valueProgress >= 75 ? 'bg-blue-500' :
                    valueProgress >= 50 ? 'bg-amber-500' :
                    'bg-slate-400'
                  }`}
                  style={{ width: `${valueProgress}%` }}
                />
              </div>
            </div>

            {/* Quantity Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Volume Target</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {teamPerformance.totalQuantity} <span className="text-slate-400">/ {adminTarget.targetQuantity} units</span>
                  </p>
                </div>
                <p className={`text-sm font-bold ${quantityProgress >= 100 ? 'text-emerald-600' : quantityProgress >= 50 ? 'text-amber-600' : 'text-slate-900'}`}>
                  {(quantityProgress || 0).toFixed(1)}%
                </p>
              </div>
              <div className="h-2 bg-slate-100 border border-slate-200 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    quantityProgress >= 100 ? 'bg-emerald-500' :
                    quantityProgress >= 75 ? 'bg-blue-500' :
                    quantityProgress >= 50 ? 'bg-amber-500' :
                    'bg-slate-400'
                  }`}
                  style={{ width: `${quantityProgress}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
              <Target size={24} className="text-slate-300" />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">No Active Target</p>
            <p className="text-[10px] text-slate-400 mt-1">Set a team performance goal to track progress</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md border border-slate-200">
            <div className="p-8 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{adminTarget ? 'Edit' : 'Set'} Team Target</h3>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-1">Admin Performance Goal</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-8 space-y-5">
              {!adminTarget && (
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Period</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['WEEKLY', 'MONTHLY', 'QUARTERLY'].map((p) => (
                      <button
                        key={p}
                        onClick={() => setFormData({ ...formData, period: p })}
                        className={`py-2.5 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                          formData.period === p
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Revenue Target (₵)</label>
                <input
                  type="number"
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 text-sm font-semibold outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                  placeholder="50000"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Volume Target (Units)</label>
                <input
                  type="number"
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 text-sm font-semibold outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                  placeholder="500"
                  value={formData.targetQuantity}
                  onChange={(e) => setFormData({ ...formData, targetQuantity: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="pt-5 border-t border-slate-200">
                <button
                  onClick={handleCreateOrUpdate}
                  disabled={loading || !formData.targetValue || !formData.targetQuantity}
                  className="w-full h-12 bg-slate-900 text-white font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <RefreshCcw className="animate-spin" size={16} /> : (adminTarget ? 'Update Target' : 'Activate Target')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
