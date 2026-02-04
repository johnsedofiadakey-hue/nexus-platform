"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Palette, Users, CreditCard, Save, RotateCcw, Shield, Plus, Trash2, Check, X } from "lucide-react";

// --- TEAM MANAGER COMPONENT ---
function TeamManager() {
    const [team, setTeam] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // New User Form
    const [newUser, setNewUser] = useState({
        name: '', email: '', password: '', role: 'ASSISTANT', permissions: [] as string[]
    });

    const AVAILABLE_PERMISSIONS = [
        "VIEW_REPORTS", "MANAGE_INVENTORY", "MANAGE_STAFF", "VIEW_FINANCE", "EDIT_SETTINGS"
    ];

    const fetchTeam = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/hr/team');
            if (res.ok) setTeam(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchTeam(); }, []);

    const handleInvite = async () => {
        if (!newUser.name || !newUser.email || !newUser.password) return alert("Fill all fields");
        const res = await fetch('/api/hr/team', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser)
        });
        if (res.ok) {
            setShowModal(false);
            setNewUser({ name: '', email: '', password: '', role: 'ASSISTANT', permissions: [] });
            fetchTeam();
        } else {
            alert('Failed to invite');
        }
    };

    const togglePerm = (p: string) => {
        setNewUser(prev => ({
            ...prev,
            permissions: prev.permissions.includes(p)
                ? prev.permissions.filter(x => x !== p)
                : [...prev.permissions, p]
        }));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-900 uppercase">Authorized Accounts</h3>
                <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all">
                    <Plus size={14} /> Add User
                </button>
            </div>

            {/* LIST */}
            <div className="space-y-3">
                {team.map(user => (
                    <div key={user.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center font-black text-slate-400">
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900">{user.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{user.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${user.role === 'SUPER_ADMIN' ? 'bg-indigo-50 text-indigo-600' :
                                user.role === 'ADMIN' ? 'bg-blue-50 text-blue-600' :
                                    user.role === 'ASSISTANT' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                                }`}>
                                {user.role.replace('_', ' ')}
                            </span>
                            {/* Delete Button (If not self) */}
                            <button className="p-2 text-rose-300 hover:text-rose-600 transition-colors">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
                {team.length === 0 && !loading && (
                    <div className="text-center py-10 text-slate-400 text-sm">No authorized members found.</div>
                )}
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-600"><X size={20} /></button>

                        <h3 className="text-xl font-black text-slate-900 mb-6">Invite New Member</h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label-xs">Full Name</label>
                                    <input className="input-field" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="e.g. John Doe" />
                                </div>
                                <div>
                                    <label className="label-xs">Email Address</label>
                                    <input className="input-field" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="john@nexus.com" />
                                </div>
                            </div>

                            <div>
                                <label className="label-xs">Temporary Password</label>
                                <input className="input-field" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder="******" />
                            </div>

                            <div className="space-y-2">
                                <label className="label-xs">Access Level</label>
                                <div className="flex gap-2">
                                    {['ADMIN', 'ASSISTANT', 'AUDITOR'].map(r => (
                                        <button
                                            key={r}
                                            onClick={() => setNewUser({ ...newUser, role: r })}
                                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${newUser.role === r
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {newUser.role === 'ASSISTANT' && (
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <label className="label-xs mb-3 block">Granular Permissions</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {AVAILABLE_PERMISSIONS.map(perm => (
                                            <button
                                                key={perm}
                                                onClick={() => togglePerm(perm)}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold transition-all border ${newUser.permissions.includes(perm)
                                                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                                                    : 'bg-white text-slate-400 border-slate-200'
                                                    }`}
                                            >
                                                <div className={`w-3 h-3 rounded-full border ${newUser.permissions.includes(perm) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`} />
                                                {perm.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button onClick={handleInvite} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 mt-4">
                                Send Invite
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .label-xs { @apply text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block; }
                .input-field { @apply w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500 focus:bg-white transition-all; }
            `}</style>
        </div>
    );
}

export default function SettingsPage() {
    const { theme, updateTheme, refreshTheme } = useTheme();
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'TEAM' | 'BILLING'>('GENERAL');

    // Edit State
    const [formTheme, setFormTheme] = useState(theme);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formTheme)
            });
            if (res.ok) {
                updateTheme(formTheme); // Immediate Client Update
            } else {
                alert('Failed to save settings');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">System Configuration</h1>

            {/* TABS */}
            <div className="flex gap-4 border-b border-slate-200 pb-1">
                <button
                    onClick={() => setActiveTab('GENERAL')}
                    className={`pb-3 px-2 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'GENERAL' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Branding & Theme
                </button>
                <button
                    onClick={() => setActiveTab('TEAM')}
                    className={`pb-3 px-2 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'TEAM' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Roles & Members
                </button>
                <button
                    onClick={() => setActiveTab('BILLING')}
                    className={`pb-3 px-2 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'BILLING' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Subscription
                </button>
            </div>

            {/* CONTENT */}
            <div className="grid grid-cols-12 gap-8">

                {activeTab === 'GENERAL' && (
                    <div className="col-span-12 lg:col-span-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Palette className="text-slate-400" />
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Visual Identity</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Organization Name</label>
                                    <input
                                        type="text"
                                        value={formTheme.name || ''}
                                        onChange={(e) => setFormTheme({ ...formTheme, name: e.target.value })}
                                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Company Logo</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden">
                                            {formTheme.logoUrl ? (
                                                <img src={formTheme.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                                            ) : (
                                                <Shield size={20} className="text-slate-300" />
                                            )}
                                        </div>
                                        <label className="cursor-pointer bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">
                                            Upload File
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            setFormTheme({ ...formTheme, logoUrl: reader.result as string });
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                        </label>
                                        {formTheme.logoUrl && (
                                            <button
                                                onClick={() => setFormTheme({ ...formTheme, logoUrl: '' })}
                                                className="text-rose-400 hover:text-rose-600 p-2"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Primary Color</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={formTheme.primaryColor} onChange={(e) => setFormTheme({ ...formTheme, primaryColor: e.target.value })} className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer overflow-hidden p-0" />
                                        <span className="text-xs font-mono font-bold text-slate-500">{formTheme.primaryColor}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Secondary Color</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={formTheme.secondaryColor} onChange={(e) => setFormTheme({ ...formTheme, secondaryColor: e.target.value })} className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer overflow-hidden p-0" />
                                        <span className="text-xs font-mono font-bold text-slate-500">{formTheme.secondaryColor}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Accent Color</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={formTheme.accentColor} onChange={(e) => setFormTheme({ ...formTheme, accentColor: e.target.value })} className="w-10 h-10 rounded-lg border-2 border-slate-200 cursor-pointer overflow-hidden p-0" />
                                        <span className="text-xs font-mono font-bold text-slate-500">{formTheme.accentColor}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all flex items-center gap-2"
                                    disabled={saving}
                                >
                                    {saving ? <RotateCcw className="animate-spin" size={14} /> : <Save size={14} />}
                                    Save Config
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'TEAM' && (
                    <div className="col-span-12 lg:col-span-8 animate-in fade-in slide-in-from-bottom-4">
                        <TeamManager />
                    </div>
                )}

                {activeTab === 'BILLING' && (
                    <div className="col-span-12 lg:col-span-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-slate-900 text-white p-8 rounded-3xl relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-black mb-2">Nexus Enterprise</h3>
                                <p className="text-slate-400 text-sm mb-6">Active Subscription • Annual Plan</p>

                                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-500 mb-8">
                                    <span>Renews: Dec 2026</span>
                                    <span>•</span>
                                    <span>$499 / Year</span>
                                </div>

                                <button className="px-6 py-3 bg-white text-slate-900 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all">
                                    Manage Billing
                                </button>
                            </div>

                            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-50 pointer-events-none"></div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
