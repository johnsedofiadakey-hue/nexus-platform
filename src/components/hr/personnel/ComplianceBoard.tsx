"use client";

import React, { useState } from "react";
import { Clock, AlertTriangle, FileText, CheckCircle, XCircle, Gavel, Plus, Lock, Unlock, X, Loader2 } from "lucide-react";

export default function ComplianceBoard({ attendance = [], leaveRequests = [], onUpdateLeave, onRecallLeave, staffId }: any) {
  const [activeSubTab, setActiveSubTab] = useState<'ATTENDANCE' | 'LEAVE' | 'DISCIPLINARY'>('ATTENDANCE');
  
  // --- DISCIPLINARY STATE ---
  // In a real app, you might fetch this separately, but for now we'll assume it's passed or managed locally
  // For this demo, let's assume we fetch it or use a simple local state if not passed
  const [disciplinaryLog, setDisciplinaryLog] = useState<any[]>([]); 
  const [showCitationModal, setShowCitationModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [citationForm, setCitationForm] = useState({
    type: "LATENESS", severity: "LOW", description: ""
  });

  // Check if currently on approved leave (System Locked)
  const activeLeave = leaveRequests.find((r: any) => {
    const now = new Date();
    const start = new Date(r.startDate);
    const end = new Date(r.endDate);
    return r.status === 'APPROVED' && now >= start && now <= end;
  });

  // Fetch Disciplinary Records on tab switch if needed
  // Note: ideally passed from parent, but we can do a quick fetch here if staffId exists
  React.useEffect(() => {
    if (activeSubTab === 'DISCIPLINARY' && staffId) {
        fetch(`/api/hr/disciplinary?userId=${staffId}`)
            .then(res => res.json())
            .then(data => {
                if(Array.isArray(data)) setDisciplinaryLog(data);
            })
            .catch(err => console.error("Failed to load records"));
    }
  }, [activeSubTab, staffId]);


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
            const newRecord = await res.json();
            setDisciplinaryLog(prev => [newRecord, ...prev]);
            setShowCitationModal(false);
            setCitationForm({ type: "LATENESS", severity: "LOW", description: "" });
            alert(citationForm.severity === 'CRITICAL' ? "Citation Issued & User Suspended." : "Citation Issued.");
        }
    } catch (err) {
        alert("Failed to issue citation.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[600px] relative">
       
       {/* ACTIVE LOCK ALERT */}
       {activeLeave && (
         <div className="bg-red-50 p-4 border-b border-red-100 flex items-center justify-between">
            <div className="flex items-center gap-3 text-red-700">
               <Lock className="w-5 h-5" />
               <div>
                  <h4 className="text-xs font-black uppercase tracking-widest">System Access Locked</h4>
                  <p className="text-[10px] font-bold opacity-80">Agent is currently on leave until {new Date(activeLeave.endDate).toDateString()}</p>
               </div>
            </div>
            <button 
              onClick={() => onRecallLeave(activeLeave.id)}
              className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center gap-2"
            >
               <Unlock className="w-3.5 h-3.5" /> Recall / Unlock
            </button>
         </div>
       )}

       {/* TAB HEADER */}
       <div className="flex border-b border-slate-100">
          {[
            { id: 'ATTENDANCE', icon: Clock, label: 'Attendance' },
            { id: 'LEAVE', icon: FileText, label: 'Leave Requests' },
            { id: 'DISCIPLINARY', icon: Gavel, label: 'Conduct Log' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex-1 py-5 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                activeSubTab === tab.id 
                ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
               <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
       </div>

       <div className="p-8">
          
          {/* 1. ATTENDANCE VIEW */}
          {activeSubTab === 'ATTENDANCE' && (
             <div className="space-y-4">
                {attendance.length === 0 ? (
                   <div className="text-center py-20 opacity-40">
                      <Clock className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-sm">No Attendance Records</p>
                   </div>
                ) : attendance.map((log: any) => (
                   <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 font-black text-slate-400 text-xs">
                            {new Date(log.date).getDate()}
                         </div>
                         <div>
                            <p className="text-xs font-black text-slate-900">{new Date(log.date).toDateString()}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                               IN: {log.clockInTime ? new Date(log.clockInTime).toLocaleTimeString() : '--:--'} • 
                               OUT: {log.clockOutTime ? new Date(log.clockOutTime).toLocaleTimeString() : 'Active'}
                            </p>
                         </div>
                      </div>
                      <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-widest">
                         Verified
                      </div>
                   </div>
                ))}
             </div>
          )}

          {/* 2. LEAVE REQUESTS */}
          {activeSubTab === 'LEAVE' && (
             <div className="space-y-4">
                {leaveRequests.length === 0 ? (
                   <div className="text-center py-20 opacity-40">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-sm">No Active Requests</p>
                   </div>
                ) : leaveRequests.map((req: any) => (
                   <div key={req.id} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                         <div>
                            <span className="px-2 py-1 bg-slate-900 text-white rounded-md text-[9px] font-black uppercase tracking-widest mb-2 inline-block">
                               {req.type}
                            </span>
                            <h4 className="text-sm font-bold text-slate-700">
                               {new Date(req.startDate).toDateString()} — {new Date(req.endDate).toDateString()}
                            </h4>
                         </div>
                         {req.status === 'PENDING' ? (
                            <div className="flex gap-2">
                               <button onClick={() => onUpdateLeave(req.id, 'APPROVED')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"><CheckCircle className="w-4 h-4" /></button>
                               <button onClick={() => onUpdateLeave(req.id, 'REJECTED')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><XCircle className="w-4 h-4" /></button>
                            </div>
                         ) : (
                            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                               {req.status}
                            </span>
                         )}
                      </div>
                      <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                         "{req.reason}"
                      </p>
                   </div>
                ))}
             </div>
          )}

          {/* 3. DISCIPLINARY LOG */}
          {activeSubTab === 'DISCIPLINARY' && (
             <div>
                <div className="flex justify-end mb-6">
                    <button 
                        onClick={() => setShowCitationModal(true)}
                        className="px-6 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Issue Citation
                    </button>
                </div>

                {disciplinaryLog.length === 0 ? (
                    <div className="p-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
                        <Gavel className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Clean Record</h3>
                        <p className="text-xs text-slate-500 mt-1">No infractions recorded.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {disciplinaryLog.map((rec, i) => (
                            <div key={i} className="p-4 bg-white border border-slate-200 rounded-2xl flex items-start gap-4">
                                <div className={`mt-1 w-10 h-10 rounded-xl flex items-center justify-center text-white ${rec.severity === 'CRITICAL' ? 'bg-red-600' : 'bg-amber-500'}`}>
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-black text-sm text-slate-900">{rec.type}</h4>
                                        <span className="text-[9px] font-bold bg-slate-100 px-2 rounded text-slate-500 uppercase">{rec.severity}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 mb-2">{rec.description}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Issued By: {rec.issuer?.name || "Admin"} • {new Date(rec.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
             </div>
          )}
       </div>

       {/* --- CITATION MODAL --- */}
       {showCitationModal && (
         <div className="absolute inset-0 z-50 bg-slate-900/10 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in zoom-in duration-200 border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" /> Issue Warning
                    </h3>
                    <button onClick={() => setShowCitationModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
                </div>
                
                <form onSubmit={handleIssueCitation} className="space-y-4">
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Infraction Type</label>
                        <select 
                            className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-xs outline-none"
                            value={citationForm.type}
                            onChange={e => setCitationForm({...citationForm, type: e.target.value})}
                        >
                            <option value="LATENESS">Habitual Lateness</option>
                            <option value="MISCONDUCT">General Misconduct</option>
                            <option value="NEGLIGENCE">Negligence of Duty</option>
                            <option value="THEFT">Theft / Fraud (Critical)</option>
                            <option value="INSUBORDINATION">Insubordination</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Severity Level</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['LOW', 'MEDIUM', 'CRITICAL'].map(sev => (
                                <button 
                                    key={sev} type="button"
                                    onClick={() => setCitationForm({...citationForm, severity: sev})}
                                    className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                                        citationForm.severity === sev 
                                        ? (sev === 'CRITICAL' ? 'bg-red-600 text-white border-red-600' : 'bg-slate-900 text-white border-slate-900')
                                        : 'bg-white text-slate-400 border-slate-200'
                                    }`}
                                >
                                    {sev}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Incident Details</label>
                        <textarea 
                            required
                            className="w-full h-24 p-4 bg-slate-50 rounded-xl border border-slate-200 font-bold text-xs outline-none resize-none"
                            placeholder="Describe the incident..."
                            value={citationForm.description}
                            onChange={e => setCitationForm({...citationForm, description: e.target.value})}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full py-4 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm & Log Citation"}
                    </button>
                </form>
            </div>
         </div>
       )}
    </div>
  );
}