"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, Gavel, Search, FileText, 
  AlertTriangle, CheckCircle, User, X, Loader2, Building2 
} from "lucide-react";

export default function DisciplinaryPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // MODAL STATE
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    userId: "",
    category: "Misconduct",
    severity: "LOW",
    description: "",
    actionTaken: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Incidents
      const incRes = await fetch("/api/hr/disciplinary?t=" + Date.now());
      if (incRes.ok) setIncidents(await incRes.json());

      // 2. Fetch Staff (for the dropdown)
      const staffRes = await fetch("/api/hr/staff");
      if (staffRes.ok) setStaff(await staffRes.json());
    } catch (e) {
      console.error("Load failed", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/hr/disciplinary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsModalOpen(false);
        loadData(); // Refresh list immediately
        setFormData({ userId: "", category: "Misconduct", severity: "LOW", description: "", actionTaken: "" });
        alert(formData.severity === "CRITICAL" ? "Incident Logged & Staff Suspended" : "Incident Recorded");
      } else {
        alert("Failed to record incident.");
      }
    } catch (error) {
      alert("Network Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for Severity Colors
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return "bg-red-50 text-red-600 border-red-100";
      case 'HIGH': return "bg-orange-50 text-orange-600 border-orange-100";
      case 'MEDIUM': return "bg-yellow-50 text-yellow-600 border-yellow-100";
      default: return "bg-blue-50 text-blue-600 border-blue-100";
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 bg-slate-50/50 min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Conduct & Gavel</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
             <ShieldAlert className="w-4 h-4 text-red-500" /> Disciplinary Records
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-200"
        >
          <Gavel className="w-4 h-4" /> Log Incident
        </button>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
           <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertTriangle className="w-5 h-5" /></div>
             <span className="text-[10px] font-black uppercase text-slate-400">Total Incidents</span>
           </div>
           <p className="text-3xl font-black text-slate-900">{incidents.length}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
           <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><ShieldAlert className="w-5 h-5" /></div>
             <span className="text-[10px] font-black uppercase text-slate-400">Critical Cases</span>
           </div>
           <p className="text-3xl font-black text-slate-900">{incidents.filter(i => i.severity === 'CRITICAL').length}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
           <div className="flex items-center gap-3 mb-2">
             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><CheckCircle className="w-5 h-5" /></div>
             <span className="text-[10px] font-black uppercase text-slate-400">Staff Involved</span>
           </div>
           <p className="text-3xl font-black text-slate-900">
             {new Set(incidents.map(i => i.userId)).size}
           </p> 
        </div>
      </div>

      {/* INCIDENT REPORT FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h3 className="font-black text-lg text-slate-900">New Disciplinary Report</h3>
               <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-red-500" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              
              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase">Staff Member</label>
                 <select 
                   required
                   className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-xs outline-none focus:border-blue-500 transition-all"
                   onChange={e => setFormData({...formData, userId: e.target.value})}
                   value={formData.userId}
                 >
                   <option value="">-- Select Personnel --</option>
                   {staff.map(p => (
                     <option key={p.id} value={p.id}>{p.name} ({p.shop?.name || "No Shop"})</option>
                   ))}
                 </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                   <select 
                     className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-xs outline-none focus:border-blue-500 transition-all"
                     onChange={e => setFormData({...formData, category: e.target.value})}
                     value={formData.category}
                   >
                     <option>Geofence Violation</option>
                     <option>Late Arrival</option>
                     <option>Misconduct</option>
                     <option>Inventory Discrepancy</option>
                     <option>Theft / Fraud</option>
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase">Severity Level</label>
                   <select 
                     className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-xs outline-none focus:border-blue-500 transition-all"
                     onChange={e => setFormData({...formData, severity: e.target.value})}
                     value={formData.severity}
                   >
                     <option value="LOW">Low (Warning)</option>
                     <option value="MEDIUM">Medium (Write-up)</option>
                     <option value="HIGH">High (Serious)</option>
                     <option value="CRITICAL">Critical (Termination)</option>
                   </select>
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase">Incident Details</label>
                 <textarea 
                   required
                   rows={3}
                   placeholder="Describe what happened..." 
                   className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-xs outline-none focus:border-blue-500 transition-all resize-none"
                   onChange={e => setFormData({...formData, description: e.target.value})}
                   value={formData.description}
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase">Action Taken</label>
                 <input 
                   placeholder="e.g. Verbal Warning given" 
                   className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-xs outline-none focus:border-blue-500 transition-all"
                   onChange={e => setFormData({...formData, actionTaken: e.target.value})}
                   value={formData.actionTaken}
                 />
              </div>

              <button disabled={isSubmitting} type="submit" className="w-full py-4 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                 {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm & Log Record"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RECORDS LIST */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-20 gap-3 text-slate-400">
             <Loader2 className="w-6 h-6 animate-spin" />
             <span className="text-xs font-bold uppercase tracking-widest">Loading Logs...</span>
          </div>
        ) : incidents.length === 0 ? (
          <div className="text-center py-24">
             <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-4" />
             <h3 className="text-lg font-black text-slate-900">Clean Record</h3>
             <p className="text-sm text-slate-500 mt-1">No disciplinary incidents recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {incidents.map((item) => (
              <div key={item.id} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-6 group">
                 
                 <div className="flex items-start gap-6">
                    <div className={`mt-1 w-12 h-12 rounded-2xl flex items-center justify-center font-black shrink-0 ${getSeverityStyle(item.severity)}`}>
                      <Gavel className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                         <h3 className="font-black text-slate-900 text-sm">{item.type}</h3>
                         <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${getSeverityStyle(item.severity)}`}>
                           {item.severity} Level
                         </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-2xl mb-2">{item.description}</p>
                      
                      {/* ACTION TAKEN PILL */}
                      {item.actionTaken && (
                        <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                           <CheckCircle className="w-3 h-3" /> {item.actionTaken}
                        </div>
                      )}
                    </div>
                 </div>

                 <div className="flex flex-col md:items-end gap-1.5 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0 pl-16 md:pl-0">
                    <div className="flex items-center gap-2 text-slate-900">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-xs uppercase tracking-wide">{item.user?.name || "Unknown Staff"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wide">
                      <Building2 className="w-3 h-3" /> {item.user?.shop?.name || "HQ / Unassigned"}
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">
                       {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                 </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}