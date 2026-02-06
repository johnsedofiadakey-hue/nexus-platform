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
          className="bg-blue-600 text-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors border border-blue-700"
        >
          + Set New Target
        </button>
      </div>

      {targets && targets.length > 0 ? (
        <div className="space-y-4">
          {targets.map((target) => (
            <div
              key={target.id}
              className="bg-white border border-slate-200 p-6 relative overflow-hidden group hover:border-blue-300 transition-colors"
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
                    className={`px-2 py-1 border text-[9px] font-black uppercase ${target.status === 'ACTIVE' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
                  >
                    {target.status}
                  </span>
                  <button
                    onClick={() => handleEdit(target)}
                    className="p-2 hover:bg-blue-50 border border-transparent hover:border-blue-200 text-blue-600 transition-colors"
                    title="Edit Target"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(target.id)}
                    className="p-2 hover:bg-red-50 border border-transparent hover:border-red-200 text-red-600 transition-colors"
                    title="Delete Target"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => setShowHistory(showHistory === target.id ? null : target.id)}
                    className="p-2 hover:bg-slate-100 border border-transparent hover:border-slate-200 text-slate-600 transition-colors"
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
                      <div key={item.id} className="bg-slate-50 p-3 border border-slate-200 text-xs">
                        <div className="flex justify-between items-start mb-1">
                          <span className={`px-2 py-0.5 border text-[9px] font-black uppercase ${
                            item.action === 'CREATED' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                            item.action === 'UPDATED' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                            item.action === 'DELETED' ? 'bg-red-50 border-red-200 text-red-700' :
                            'bg-slate-100 border-slate-200 text-slate-600'
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
        <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No active targets set</p>
        </div>
      )}

      {/* Edit Modal */}
      {editingTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-black text-xl text-slate-900">Edit Target</h3>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-1">Update Performance Goals</p>
              </div>
              <button onClick={() => setEditingTarget(null)} className="p-2 hover:bg-slate-100 border border-slate-200 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Sales Target (₵)</label>
                <input
                  type="number"
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Quantity Target</label>
                <input
                  type="number"
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  value={formData.targetQuantity}
                  onChange={(e) => setFormData({ ...formData, targetQuantity: e.target.value })}
                />
              </div>
              <div className="pt-4 border-t border-slate-200 flex gap-3">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 h-12 bg-blue-600 text-white font-bold uppercase tracking-wider hover:bg-blue-700 transition-colors border border-blue-700"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingTarget(null)}
                  className="h-12 px-5 bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors border border-slate-200"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-black text-xl text-slate-900">New Target</h3>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-1">Set Performance Goals</p>
              </div>
              <button onClick={() => setShowNewModal(false)} className="p-2 hover:bg-slate-100 border border-slate-200 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-3">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Period</label>
                <div className="grid grid-cols-3 gap-2">
                  {['WEEKLY', 'MONTHLY', 'QUARTERLY'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setFormData({ ...formData, period: p })}
                      className={`py-2.5 text-[10px] font-bold uppercase tracking-wider border transition-colors ${formData.period === p ? 'bg-blue-600 border-blue-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Sales Target (₵)</label>
                <input
                  type="number"
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  placeholder="0.00"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Quantity Target</label>
                <input
                  type="number"
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  placeholder="0"
                  value={formData.targetQuantity}
                  onChange={(e) => setFormData({ ...formData, targetQuantity: e.target.value })}
                />
              </div>
              <div className="pt-4 border-t border-slate-200">
                <button
                  onClick={handleCreateNew}
                  disabled={!formData.targetQuantity || !formData.targetValue}
                  className="w-full h-12 bg-slate-900 text-white font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors disabled:opacity-50 border border-slate-900 disabled:border-slate-400"
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
