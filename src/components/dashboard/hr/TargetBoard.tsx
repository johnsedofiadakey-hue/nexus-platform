"use client";

import React, { useState } from "react";
import {
  Target as TargetIcon, Edit2, Trash2, X, Calendar,
  TrendingUp, Save, History, ChevronDown, ChevronUp,
  BarChart3, Award, Clock
} from "lucide-react";
import { toast } from "react-hot-toast";

interface Target {
  id: string;
  targetQuantity: number;
  targetValue: number;
  startDate: string;
  endDate: string;
  status: string;
  history?: TargetHistoryItem[];
}

interface TargetHistoryItem {
  id: string;
  action: string;
  previousValue: any;
  newValue: any;
  progress: number;
  achievedValue: number;
  achievedQuantity: number;
  notes: string;
  createdAt: string;
}

interface TargetBoardProps {
  targets: Target[];
  userId: string;
  onRefresh: () => void;
}

export default function TargetBoard({ targets, userId, onRefresh }: TargetBoardProps) {
  const [editingTarget, setEditingTarget] = useState<Target | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const [formData, setFormData] = useState({
    targetQuantity: "",
    targetValue: "",
    period: "MONTHLY"
  });

  const handleEdit = (target: Target) => {
    setEditingTarget(target);
    setFormData({
      targetQuantity: target.targetQuantity.toString(),
      targetValue: target.targetValue.toString(),
      period: "MONTHLY"
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTarget) return;

    const t = toast.loading("Updating target...");
    try {
      const response = await fetch("/api/targets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: editingTarget.id,
          targetQuantity: parseInt(formData.targetQuantity),
          targetValue: parseFloat(formData.targetValue),
        }),
      });

      if (response.ok) {
        toast.success("Target updated successfully", { id: t });
        setEditingTarget(null);
        onRefresh();
      } else {
        throw new Error("Failed to update target");
      }
    } catch (error) {
      toast.error("Failed to update target", { id: t });
    }
  };

  const handleDelete = async (targetId: string) => {
    if (!confirm("Are you sure you want to delete this target? This action cannot be undone.")) {
      return;
    }

    const t = toast.loading("Deleting target...");
    try {
      const response = await fetch(`/api/targets?targetId=${targetId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Target deleted successfully", { id: t });
        onRefresh();
      } else {
        throw new Error("Failed to delete target");
      }
    } catch (error) {
      toast.error("Failed to delete target", { id: t });
    }
  };

  const handleCreateNew = async () => {
    const t = toast.loading("Creating target...");
    try {
      const now = new Date();
      let end = new Date();
      if (formData.period === "WEEKLY") end.setDate(now.getDate() + 7);
      else if (formData.period === "MONTHLY") end.setMonth(now.getMonth() + 1);
      else if (formData.period === "QUARTERLY") end.setMonth(now.getMonth() + 3);

      const response = await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          targetQuantity: parseInt(formData.targetQuantity),
          targetValue: parseFloat(formData.targetValue),
          startDate: now,
          endDate: end,
        }),
      });

      if (response.ok) {
        toast.success("Target created successfully", { id: t });
        setShowNewModal(false);
        setFormData({ targetQuantity: "", targetValue: "", period: "MONTHLY" });
        onRefresh();
      } else {
        throw new Error("Failed to create target");
      }
    } catch (error) {
      toast.error("Failed to create target", { id: t });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-slate-900">Performance Targets</h3>
        <button
          onClick={() => setShowNewModal(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 hover:-translate-y-0.5"
        >
          + Set New Target
        </button>
      </div>

      {targets && targets.length > 0 ? (
        <div className="space-y-4">
          {targets.map((target) => (
            <div
              key={target.id}
              className="bg-slate-50 border border-slate-200 p-6 rounded-2xl relative overflow-hidden group hover:border-blue-200 transition-all"
            >
              <div className={`absolute top-0 left-0 w-1 h-full ${target.status === 'ACTIVE' ? 'bg-blue-500' : 'bg-slate-300'}`} />
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Period</p>
                  <p className="text-xs font-bold text-slate-700 mt-1">
                    {new Date(target.startDate).toLocaleDateString()} - {new Date(target.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-[9px] font-black uppercase ${target.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}
                  >
                    {target.status}
                  </span>
                  <button
                    onClick={() => handleEdit(target)}
                    className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                    title="Edit Target"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(target.id)}
                    className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                    title="Delete Target"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => setShowHistory(showHistory === target.id ? null : target.id)}
                    className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                    title="View History"
                  >
                    {showHistory === target.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sales Target</p>
                  <p className="text-xl font-black text-slate-900">₵ {target.targetValue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity Target</p>
                  <p className="text-xl font-black text-slate-900">{target.targetQuantity} Units</p>
                </div>
              </div>

              {/* History Section */}
              {showHistory === target.id && target.history && target.history.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                    <History size={14} className="text-slate-400" />
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target History</h4>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {target.history.map((item) => (
                      <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-100 text-xs">
                        <div className="flex justify-between items-start mb-1">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            item.action === 'CREATED' ? 'bg-blue-100 text-blue-600' :
                            item.action === 'UPDATED' ? 'bg-amber-100 text-amber-600' :
                            item.action === 'DELETED' ? 'bg-red-100 text-red-600' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {item.action}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {new Date(item.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="text-[10px] text-slate-600 mt-2">{item.notes}</p>
                        )}
                        {item.progress > 0 && (
                          <div className="mt-2 flex items-center gap-2 text-[10px]">
                            <BarChart3 size={12} className="text-blue-600" />
                            <span className="font-bold text-slate-700">{item.progress.toFixed(1)}% Complete</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-600">₵{item.achievedValue.toLocaleString()} / {item.achievedQuantity} units</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No active targets set</p>
        </div>
      )}

      {/* Edit Modal */}
      {editingTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <div>
                <h3 className="font-black text-2xl text-slate-900 tracking-tight">Edit Target</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Update Performance Goals</p>
              </div>
              <button onClick={() => setEditingTarget(null)} className="p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all shadow-sm">
                <X size={20} />
              </button>
            </div>

            <div className="p-10 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sales Target (₵)</label>
                <input
                  type="number"
                  className="w-full h-14 px-6 bg-slate-50 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quantity Target</label>
                <input
                  type="number"
                  className="w-full h-14 px-6 bg-slate-50 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                  value={formData.targetQuantity}
                  onChange={(e) => setFormData({ ...formData, targetQuantity: e.target.value })}
                />
              </div>
              <div className="pt-6 border-t border-slate-100 flex gap-4">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 h-14 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingTarget(null)}
                  className="h-14 px-6 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Target Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <div>
                <h3 className="font-black text-2xl text-slate-900 tracking-tight">New Target</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Set Performance Goals</p>
              </div>
              <button onClick={() => setShowNewModal(false)} className="p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all shadow-sm">
                <X size={20} />
              </button>
            </div>

            <div className="p-10 space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Period</label>
                <div className="grid grid-cols-3 gap-2">
                  {['WEEKLY', 'MONTHLY', 'QUARTERLY'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setFormData({ ...formData, period: p })}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${formData.period === p ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sales Target (₵)</label>
                <input
                  type="number"
                  className="w-full h-14 px-6 bg-slate-50 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                  placeholder="0.00"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quantity Target</label>
                <input
                  type="number"
                  className="w-full h-14 px-6 bg-slate-50 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                  placeholder="0"
                  value={formData.targetQuantity}
                  onChange={(e) => setFormData({ ...formData, targetQuantity: e.target.value })}
                />
              </div>
              <div className="pt-6 border-t border-slate-100">
                <button
                  onClick={handleCreateNew}
                  disabled={!formData.targetQuantity || !formData.targetValue}
                  className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  Create Target
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
