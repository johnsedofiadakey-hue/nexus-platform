"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Target, TrendingUp, TrendingDown, Clock, Edit, Trash2, Plus, X, Save, AlertCircle, CheckCircle, Award } from 'lucide-react';

interface TargetData {
  id: string;
  targetQuantity: number;
  targetValue: number;
  achievedQuantity: number;
  achievedValue: number;
  startDate: string;
  endDate: string;
  status: string;
  targetType: string;
  user: { name: string; role: string };
  history: any[];
  createdAt: string;
}

export default function TargetRegistryPage() {
  const { data: session } = useSession();
  const [targets, setTargets] = useState<TargetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'EXPIRED'>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<TargetData | null>(null);
  const [stats, setStats] = useState({
    totalTargets: 0,
    activeTargets: 0,
    completedTargets: 0,
    failedTargets: 0,
    overallAchievement: 0
  });

  const fetchTargets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/targets?includeHistory=true');
      if (res.ok) {
        const data = await res.json();
        setTargets(data);
        calculateStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: TargetData[]) => {
    const totalTargets = data.length;
    const activeTargets = data.filter(t => t.status === 'ACTIVE').length;
    const completedTargets = data.filter(t => t.status === 'COMPLETED').length;
    const failedTargets = data.filter(t => t.status === 'FAILED').length;
    
    // Calculate overall achievement percentage
    const totalTargetValue = data.reduce((sum, t) => sum + t.targetValue, 0);
    const totalAchievedValue = data.reduce((sum, t) => sum + t.achievedValue, 0);
    const overallAchievement = totalTargetValue > 0 ? (totalAchievedValue / totalTargetValue) * 100 : 0;

    setStats({ totalTargets, activeTargets, completedTargets, failedTargets, overallAchievement });
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this target? This action cannot be undone.')) return;
    
    const res = await fetch(`/api/targets?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchTargets();
    } else {
      alert('Failed to delete target');
    }
  };

  const handleEdit = (target: TargetData) => {
    setEditTarget(target);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editTarget) return;

    const method = editTarget.id ? 'PATCH' : 'POST';
    const res = await fetch('/api/targets', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editTarget)
    });

    if (res.ok) {
      setShowModal(false);
      setEditTarget(null);
      fetchTargets();
    } else {
      alert('Failed to save target');
    }
  };

  const getProgressColor = (achieved: number, target: number) => {
    const percentage = (achieved / target) * 100;
    if (percentage >= 100) return 'text-emerald-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 50) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-[9px] font-medium">ACTIVE</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-medium">COMPLETED</span>;
      case 'FAILED':
        return <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-[9px] font-medium">FAILED</span>;
      case 'EXPIRED':
        return <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-600 text-[9px] font-medium">EXPIRED</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-600 text-[9px] font-medium">{status}</span>;
    }
  };

  const filteredTargets = filter === 'ALL' ? targets : targets.filter(t => t.status === filter);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Target Registry</h1>
          <p className="text-xs text-slate-500 mt-1">Track performance against set targets</p>
        </div>
        <button
          onClick={() => {
            setEditTarget({
              id: '',
              targetQuantity: 0,
              targetValue: 0,
              achievedQuantity: 0,
              achievedValue: 0,
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: 'ACTIVE',
              targetType: session?.user?.role === 'ADMIN' ? 'ADMIN' : 'AGENT',
              user: { name: session?.user?.name || '', role: session?.user?.role || '' },
              history: [],
              createdAt: new Date().toISOString()
            } as TargetData);
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-slate-900 text-white text-[10px] font-semibold uppercase tracking-wider flex items-center gap-2 hover:bg-slate-800 transition-colors"
        >
          <Plus size={14} /> New Target
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={14} className="text-slate-500" />
            <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.totalTargets}</p>
        </div>

        <div className="bg-white border border-blue-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-blue-600" />
            <h3 className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Active</h3>
          </div>
          <p className="text-2xl font-bold text-blue-900">{stats.activeTargets}</p>
        </div>

        <div className="bg-white border border-emerald-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={14} className="text-emerald-600" />
            <h3 className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Completed</h3>
          </div>
          <p className="text-2xl font-bold text-emerald-900">{stats.completedTargets}</p>
        </div>

        <div className="bg-white border border-rose-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={14} className="text-rose-600" />
            <h3 className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider">Failed</h3>
          </div>
          <p className="text-2xl font-bold text-rose-900">{stats.failedTargets}</p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award size={14} />
            <h3 className="text-[10px] font-semibold uppercase tracking-wider">Achievement</h3>
          </div>
          <p className="text-2xl font-bold">{stats.overallAchievement.toFixed(1)}%</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex gap-2 bg-slate-100 border border-slate-200 p-1">
        {['ALL', 'ACTIVE', 'COMPLETED', 'FAILED', 'EXPIRED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`flex-1 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
              filter === f ? 'bg-white text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Owner / Type</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Period</th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Target Value</th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Achieved</th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Target Units</th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Achieved</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Progress</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTargets.map((target) => {
                const valueProgress = (target.achievedValue / target.targetValue) * 100;
                const quantityProgress = (target.achievedQuantity / target.targetQuantity) * 100;
                const avgProgress = (valueProgress + quantityProgress) / 2;

                return (
                  <tr key={target.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{target.user.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                          {target.targetType}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs text-slate-600">
                        <p>{new Date(target.startDate).toLocaleDateString()}</p>
                        <p className="text-[10px] text-slate-400">to {new Date(target.endDate).toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <p className="text-sm font-mono font-semibold text-slate-900">₵{target.targetValue.toLocaleString()}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <p className={`text-sm font-mono font-semibold ${getProgressColor(target.achievedValue, target.targetValue)}`}>
                        ₵{target.achievedValue.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-400">{valueProgress.toFixed(0)}%</p>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <p className="text-sm font-mono font-semibold text-slate-900">{target.targetQuantity}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <p className={`text-sm font-mono font-semibold ${getProgressColor(target.achievedQuantity, target.targetQuantity)}`}>
                        {target.achievedQuantity}
                      </p>
                      <p className="text-[10px] text-slate-400">{quantityProgress.toFixed(0)}%</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-full bg-slate-100 h-1.5">
                          <div
                            className={`h-full transition-all ${
                              avgProgress >= 100 ? 'bg-emerald-500' :
                              avgProgress >= 75 ? 'bg-blue-500' :
                              avgProgress >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(avgProgress, 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] font-semibold text-slate-600">{avgProgress.toFixed(0)}%</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {getStatusBadge(target.status)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(target)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit Target"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(target.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Target"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTargets.length === 0 && !loading && (
          <div className="text-center py-12 text-slate-400">
            <Target size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No targets found</p>
            <p className="text-xs mt-1">Create a new target to get started</p>
          </div>
        )}
      </div>

      {/* EDIT/CREATE MODAL */}
      {showModal && editTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 p-6 w-full max-w-2xl shadow-xl">
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {editTarget.id ? 'Edit Target' : 'Create New Target'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Target Type
                  </label>
                  <select
                    value={editTarget.targetType}
                    onChange={(e) => setEditTarget({ ...editTarget, targetType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="AGENT">Agent Target</option>
                    <option value="ADMIN">Admin Target</option>
                    <option value="TEAM">Team Target</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Status
                  </label>
                  <select
                    value={editTarget.status}
                    onChange={(e) => setEditTarget({ ...editTarget, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="FAILED">Failed</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Target Revenue (GHS)
                  </label>
                  <input
                    type="number"
                    value={editTarget.targetValue}
                    onChange={(e) => setEditTarget({ ...editTarget, targetValue: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Achieved Revenue (GHS)
                  </label>
                  <input
                    type="number"
                    value={editTarget.achievedValue}
                    onChange={(e) => setEditTarget({ ...editTarget, achievedValue: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Target Units
                  </label>
                  <input
                    type="number"
                    value={editTarget.targetQuantity}
                    onChange={(e) => setEditTarget({ ...editTarget, targetQuantity: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Achieved Units
                  </label>
                  <input
                    type="number"
                    value={editTarget.achievedQuantity}
                    onChange={(e) => setEditTarget({ ...editTarget, achievedQuantity: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editTarget.startDate.split('T')[0]}
                    onChange={(e) => setEditTarget({ ...editTarget, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={editTarget.endDate.split('T')[0]}
                    onChange={(e) => setEditTarget({ ...editTarget, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-slate-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-[10px] font-semibold uppercase tracking-wider hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-slate-900 text-white text-[10px] font-semibold uppercase tracking-wider hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <Save size={12} /> Save Target
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
