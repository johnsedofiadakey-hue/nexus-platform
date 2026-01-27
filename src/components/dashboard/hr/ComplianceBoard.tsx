"use client";

import React, { useState } from "react";
import { 
  Clock, AlertTriangle, FileText, CheckCircle, XCircle, 
  Gavel, Plus, Lock, Unlock, X, Loader2, MapPin, Navigation 
} from "lucide-react";

export default function ComplianceBoard({ 
  attendance = [], 
  leaveRequests = [], 
  disciplinaryLog = [], // Now passed from the updated portal state
  onUpdateLeave, 
  onRecallLeave, 
  staffId 
}: any) {
  const [activeSubTab, setActiveSubTab] = useState<'ATTENDANCE' | 'LEAVE' | 'DISCIPLINARY'>('ATTENDANCE');
  const [showCitationModal, setShowCitationModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [citationForm, setCitationForm] = useState({
    type: "LATENESS", severity: "LOW", description: ""
  });

  // System Lock Logic: Checks if current date falls within an approved leave window
  const activeLeave = leaveRequests.find((r: any) => {
    const now = new Date();
    const start = new Date(r.startDate);
    const end = new Date(r.endDate);
    return r.status === 'APPROVED' && now >= start && now <= end;
  });

  const handleIssueCitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        const res = await fetch("/api/hr/disciplinary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...citationForm, userId: staffId })
        });
        
        if (res.ok) {
            setShowCitationModal(false);
            setCitationForm({ type: "LATENESS", severity: "LOW", description: "" });
            alert("Citation logged in Nexus authority.");
        }
    } catch (err) {
        alert("System Sync Failed.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
       
       {/* --- HUB ACCESS LOCK --- */}
       {activeLeave && (
         <div className="bg-rose-50 p-4 border-b border-rose-100 flex items-center justify-between animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3 text-rose-700">
               <Lock className="w-4 h-4" />
               <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest">Mobile Lock: Active</span>
                  <span className="text-[9px] font-bold opacity-70">On leave until {new Date(activeLeave.endDate).toDateString()}</span>
               </div>
            </div>
            <button 
              onClick={() => onRecallLeave(activeLeave.id)}
              className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all"
            >
               Force Unlock
            </button>
         </div>
       )}

       {/* --- NAVIGATION --- */}
       <div className="flex border-b border-slate-50 bg-slate-50/20">
          {[
            { id: 'ATTENDANCE', icon: Clock, label: 'Duty' },
            { id: 'LEAVE', icon: FileText, label: 'Leaves' },
            { id: 'DISCIPLINARY', icon: Gavel, label: 'Security Incidents' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex-1 py-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${
                activeSubTab === tab.id 
                ? 'text-blue-600 border-blue-600 bg-white' 
                : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
               <tab.icon size={14} /> {tab.label}
            </button>
          ))}
       </div>

       {/* --- DATA STREAM --- */}
       <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* 1. DUTY LOG (Attendance) */}
          {activeSubTab === 'ATTENDANCE' && (
             attendance.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-20 opacity-20">
                   <Clock size={40} className="text-slate-400 mb-2" />
                   <span className="text-[10px] font-black uppercase tracking-widest">No Duty Cycles Found</span>
                </div>
             ) : attendance.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-black text-[11px]">
                         {new Date(log.createdAt).getDate()}
                      </div>
                      <div>
                         <p className="text-xs font-bold text-slate-900">{new Date(log.createdAt).toDateString()}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                            Start: {new Date(log.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                         </p>
                      </div>
                   </div>
                   <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                      Verified
                   </div>
                </div>
             ))
          )}

          {/* 2. LEAVE PROTOCOLS */}
          {activeSubTab === 'LEAVE' && (
             leaveRequests.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-20 opacity-20">
                   <FileText size={40} className="text-slate-400 mb-2" />
                   <span className="text-[10px] font-black uppercase tracking-widest">No Active Requests</span>
                </div>
             ) : leaveRequests.map((req: any) => (
                <div key={req.id} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                   <div className="flex justify-between items-start mb-3">
                      <div>
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                            {req.type?.replace('_', ' ')}
                         </span>
                         <h4 className="text-xs font-bold text-slate-900">
                            {new Date(req.startDate).toLocaleDateString()} — {new Date(req.endDate).toLocaleDateString()}
                         </h4>
                      </div>
                      {req.status === 'PENDING' ? (
                         <div className="flex gap-2">
                            <button onClick={() => onUpdateLeave(req.id, 'APPROVED')} className="p-2 bg-emerald-50 text-emerald-500 rounded-lg hover:bg-emerald-100 transition-colors"><CheckCircle size={16} /></button>
                            <button onClick={() => onUpdateLeave(req.id, 'REJECTED')} className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 transition-colors"><XCircle size={16} /></button>
                         </div>
                      ) : (
                         <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md ${req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {req.status}
                         </span>
                      )}
                   </div>
                   <div className="text-[11px] text-slate-500 italic px-3 py-2 bg-slate-50 rounded-lg border-l-2 border-slate-200">
                      "{req.reason}"
                   </div>
                </div>
             ))
          )}

          {/* 3. SECURITY INCIDENTS (GEOFENCE BREACHES) */}
          {activeSubTab === 'DISCIPLINARY' && (
             <div className="space-y-4">
                <button 
                    onClick={() => setShowCitationModal(true)}
                    className="w-full py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-100 transition-all flex items-center justify-center gap-2 mb-2"
                >
                    <Plus size={14} /> Manual Citation
                </button>

                {disciplinaryLog.length === 0 ? (
                    <div className="py-20 text-center opacity-20">
                        <Gavel size={40} className="text-slate-400 mx-auto mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Conduct Verified: Clear</span>
                    </div>
                ) : (
                    disciplinaryLog.map((rec: any, i: number) => {
                        const isBreach = rec.type === 'GEOFENCE_BREACH';
                        return (
                           <div key={i} className={`p-4 rounded-2xl border transition-all ${isBreach ? 'bg-rose-50/50 border-rose-100' : 'bg-white border-slate-100'}`}>
                               <div className="flex items-start gap-4">
                                   <div className={`mt-1 w-10 h-10 rounded-xl flex items-center justify-center ${rec.severity === 'CRITICAL' || isBreach ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'}`}>
                                       {isBreach ? <Navigation size={18} /> : <AlertTriangle size={18} />}
                                   </div>
                                   <div className="flex-1">
                                       <div className="flex items-center justify-between mb-1">
                                           <h4 className="font-black text-xs text-slate-900 uppercase tracking-tight">
                                               {rec.type?.replace('_', ' ')}
                                           </h4>
                                           <span className="text-[8px] font-black bg-white px-2 py-0.5 rounded border border-slate-100 text-slate-400 uppercase tracking-widest">
                                               {rec.severity}
                                           </span>
                                       </div>
                                       <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                                           {rec.details || rec.description}
                                       </p>
                                       <div className="mt-2 flex items-center gap-3 text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                          <span className="flex items-center gap-1"><Clock size={10} /> {new Date(rec.createdAt).toLocaleTimeString()}</span>
                                          {isBreach && <span className="flex items-center gap-1 text-rose-500"><MapPin size={10} /> Satellite Confirmed</span>}
                                       </div>
                                   </div>
                               </div>
                           </div>
                        );
                    })
                )}
             </div>
          )}
       </div>

       {/* --- CITATION MODAL --- */}
       {showCitationModal && (
         <div className="absolute inset-0 z-[60] bg-slate-900/10 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in duration-300 border border-slate-200">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Nexus Protocol</span>
                        <h3 className="text-sm font-black uppercase text-slate-900">Issue Conduct Warning</h3>
                    </div>
                    <button onClick={() => setShowCitationModal(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
                </div>
                
                <form onSubmit={handleIssueCitation} className="space-y-5">
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Infraction Class</label>
                        <select 
                            className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-xs outline-none focus:bg-white focus:border-blue-400 transition-all"
                            value={citationForm.type}
                            onChange={e => setCitationForm({...citationForm, type: e.target.value})}
                        >
                            <option value="LATENESS">Habitual Lateness</option>
                            <option value="GEOFENCE_BREACH">Manual Geofence Flag</option>
                            <option value="MISCONDUCT">General Misconduct</option>
                            <option value="NEGLIGENCE">Negligence of Duty</option>
                            <option value="THEFT">Theft / Fraud (Critical)</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Severity Logic</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['LOW', 'MEDIUM', 'CRITICAL'].map(sev => (
                                <button 
                                    key={sev} type="button"
                                    onClick={() => setCitationForm({...citationForm, severity: sev})}
                                    className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                                        citationForm.severity === sev 
                                        ? (sev === 'CRITICAL' ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-100' : 'bg-slate-900 text-white border-slate-900')
                                        : 'bg-white text-slate-300 border-slate-100'
                                    }`}
                                >
                                    {sev}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Incident Narrative</label>
                        <textarea 
                            required
                            className="w-full h-24 p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold text-xs outline-none resize-none focus:bg-white focus:border-blue-400 transition-all"
                            placeholder="Enter detailed narrative..."
                            value={citationForm.description}
                            onChange={e => setCitationForm({...citationForm, description: e.target.value})}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full h-14 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all flex items-center justify-center gap-3"
                    >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Authorize Citation"}
                    </button>
                </form>
            </div>
         </div>
       )}
    </div>
  );
}