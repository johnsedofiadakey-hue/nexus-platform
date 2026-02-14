"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Palette, Users, CreditCard, Save, RotateCcw, Shield, Plus, Trash2, Check, X, Loader2, AlertTriangle, CheckCircle2, Store, UserCheck } from "lucide-react";

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
            if (res.ok) {
                const payload = await res.json();
                const list = payload?.data ?? payload;
                setTeam(Array.isArray(list) ? list : []);
            }
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
        <div className="space-y-5">
            <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900">Authorized Accounts</h3>
                <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-slate-900 text-white text-[10px] font-semibold uppercase tracking-wider flex items-center gap-2 hover:bg-slate-800 transition-colors">
                    <Plus size={12} /> Add User
                </button>
            </div>

            {/* LIST */}
            <div className="space-y-3">
                {team.map(user => (
                    <div key={user.id} className="bg-white p-4 border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm">
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                                <p className="text-[10px] text-slate-500 font-mono">{user.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider border ${user.role === 'SUPER_ADMIN' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                user.role === 'ADMIN' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    user.role === 'ASSISTANT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                {user.role.replace('_', ' ')}
                            </span>
                            {/* Delete Button (If not self) */}
                            <button className="p-2 text-rose-400 hover:text-rose-600 transition-colors">
                                <Trash2 size={14} />
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white p-8 w-full max-w-lg shadow-xl border border-slate-200 relative">
                        <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X size={18} /></button>

                        <h3 className="text-lg font-bold text-slate-900 mb-6">Invite New Member</h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">Full Name</label>
                                    <input className="w-full px-3 py-2 border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="e.g. John Doe" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">Email Address</label>
                                    <input className="w-full px-3 py-2 border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="john@nexus.com" />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">Temporary Password</label>
                                <input className="w-full px-3 py-2 border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder="******" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Access Level</label>
                                <div className="flex gap-2">
                                    {['ADMIN', 'ASSISTANT', 'AUDITOR'].map(r => (
                                        <button
                                            key={r}
                                            onClick={() => setNewUser({ ...newUser, role: r })}
                                            className={`flex-1 py-2.5 text-[10px] font-semibold uppercase transition-colors border ${newUser.role === r
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {newUser.role === 'ASSISTANT' && (
                                <div className="p-4 bg-slate-50 border border-slate-200">
                                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Granular Permissions</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {AVAILABLE_PERMISSIONS.map(perm => (
                                            <button
                                                key={perm}
                                                onClick={() => togglePerm(perm)}
                                                className={`flex items-center gap-2 px-3 py-2 text-[10px] font-medium transition-colors border ${newUser.permissions.includes(perm)
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                    : 'bg-white text-slate-500 border-slate-200'
                                                    }`}
                                            >
                                                <div className={`w-3 h-3 border ${newUser.permissions.includes(perm) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`} />
                                                {perm.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button onClick={handleInvite} className="w-full py-3 bg-blue-600 text-white font-semibold uppercase tracking-wider hover:bg-blue-700 transition-colors mt-4">
                                Send Invite
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- SUBSCRIPTION MANAGER COMPONENT ---
function SubscriptionManager() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSubscription = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/subscription');
            const payload = await res.json();
            const inner = payload?.data ?? payload;
            if (payload?.success === false) {
                setError(inner?.error?.message || 'Failed to load subscription');
            } else {
                setData(inner);
            }
        } catch (e: any) {
            setError(e.message || 'Failed to load subscription');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSubscription(); }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-rose-50 border border-rose-200 p-6 text-center">
                <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
                <p className="text-sm font-semibold text-rose-700">{error || 'No subscription data available'}</p>
                <button onClick={fetchSubscription} className="mt-4 px-4 py-2 bg-rose-100 text-rose-700 text-xs font-semibold uppercase tracking-wider hover:bg-rose-200 transition-colors">
                    Retry
                </button>
            </div>
        );
    }

    const { subscription, plan, usage, billing, invoices } = data;
    const statusColors: Record<string, string> = {
        ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        GRACE: 'bg-amber-50 text-amber-700 border-amber-200',
        LOCKED: 'bg-rose-50 text-rose-700 border-rose-200',
        CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
    };
    const subStatus = subscription?.status || 'NONE';
    const statusLabel = subStatus === 'NONE' ? 'No Active Plan' : subStatus;

    return (
        <div className="space-y-6">
            {/* Plan Card */}
            <div className="bg-slate-900 text-white p-8 rounded-3xl relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-2xl font-black mb-1">
                                {plan ? `Nexus ${plan.name}` : 'No Plan'}
                            </h3>
                            <p className="text-slate-400 text-sm">
                                {subscription
                                    ? `${statusLabel} Subscription • ${subscription.billingCycle === 'ANNUAL' ? 'Annual' : 'Monthly'} Plan`
                                    : 'No active subscription'}
                            </p>
                        </div>
                        <span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border rounded-lg ${statusColors[subStatus] || 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                            {statusLabel}
                        </span>
                    </div>

                    {subscription && (
                        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">
                            <span>
                                Next Billing: {new Date(subscription.nextBillingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span>•</span>
                            <span>
                                ${billing.currentAmount.toFixed(2)} / {billing.cycle === 'ANNUAL' ? 'Year' : 'Month'}
                            </span>
                        </div>
                    )}

                    {plan && (
                        <div className="flex items-center gap-3 text-xs text-slate-400 mb-6">
                            <span className="flex items-center gap-1">
                                <CreditCard size={12} /> ${plan.pricePerShopMonthly}/shop/month
                            </span>
                            {plan.annualDiscountPercent > 0 && (
                                <>
                                    <span>•</span>
                                    <span className="text-emerald-400">{plan.annualDiscountPercent}% annual discount</span>
                                </>
                            )}
                        </div>
                    )}

                    {subscription?.status === 'GRACE' && subscription.graceEndsAt && (
                        <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl px-4 py-3 mb-4">
                            <p className="text-amber-300 text-xs font-semibold flex items-center gap-2">
                                <AlertTriangle size={14} />
                                Grace period ends: {new Date(subscription.graceEndsAt).toLocaleDateString()}
                            </p>
                        </div>
                    )}
                </div>
                <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-50 pointer-events-none"></div>
            </div>

            {/* Usage Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 border border-slate-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 bg-blue-50 flex items-center justify-center rounded-lg">
                            <Store size={16} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{usage.shops}</p>
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Active Shops</p>
                        </div>
                    </div>
                    {plan && (
                        <p className="text-[10px] text-slate-400 font-medium">
                            Billed at ${plan.pricePerShopMonthly}/shop/month = ${(usage.shops * plan.pricePerShopMonthly).toFixed(2)}/month
                        </p>
                    )}
                </div>
                <div className="bg-white p-5 border border-slate-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 bg-emerald-50 flex items-center justify-center rounded-lg">
                            <UserCheck size={16} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{usage.users}</p>
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Team Members</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Plan Features */}
            {plan?.features && plan.features.length > 0 && (
                <div className="bg-white p-6 border border-slate-200">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Included Features</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {plan.features.map((f: string) => (
                            <div key={f} className="flex items-center gap-2 text-sm text-slate-700">
                                <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                                <span className="font-medium capitalize">{f.replace(/-/g, ' ')}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Invoices */}
            {invoices && invoices.length > 0 && (
                <div className="bg-white p-6 border border-slate-200">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Recent Invoices</h4>
                    <div className="space-y-2">
                        {invoices.map((inv: any) => (
                            <div key={inv.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                                <div>
                                    <p className="text-sm font-semibold text-slate-700">
                                        ${inv.amount.toFixed(2)}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                        {new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider border rounded ${inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                    inv.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                        'bg-rose-50 text-rose-600 border-rose-200'}`}>
                                    {inv.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!subscription && (
                <div className="bg-blue-50 border border-blue-200 p-6 text-center">
                    <p className="text-sm text-blue-700 font-semibold mb-1">No active subscription</p>
                    <p className="text-xs text-blue-500">Contact your platform administrator to set up a subscription plan.</p>
                </div>
            )}
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
        <div className="space-y-6">
            <h1 className="text-xl font-bold text-slate-900">System Configuration</h1>

            {/* TABS */}
            <div className="flex gap-6 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('GENERAL')}
                    className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-colors ${activeTab === 'GENERAL' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Branding & Theme
                </button>
                <button
                    onClick={() => setActiveTab('TEAM')}
                    className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-colors ${activeTab === 'TEAM' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Roles & Members
                </button>
                <button
                    onClick={() => setActiveTab('BILLING')}
                    className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-colors ${activeTab === 'BILLING' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Subscription
                </button>
            </div>

            {/* CONTENT */}
            <div className="grid grid-cols-12 gap-8">

                {activeTab === 'GENERAL' && (
                    <div className="col-span-12 lg:col-span-8 space-y-6">
                        <div className="bg-white p-6 border border-slate-200 space-y-5">
                            <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                                <Palette size={18} className="text-slate-500" />
                                <h3 className="text-sm font-semibold text-slate-900">Visual Identity</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Organization Name</label>
                                    <input
                                        type="text"
                                        value={formTheme.name || ''}
                                        onChange={(e) => setFormTheme({ ...formTheme, name: e.target.value })}
                                        className="w-full h-11 px-4 bg-slate-50 border border-slate-200 font-semibold text-sm outline-none focus:border-slate-900 focus:bg-white transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Company Logo</label>
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
                                            {formTheme.logoUrl ? (
                                                <img src={formTheme.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                                            ) : (
                                                <Shield size={18} className="text-slate-300" />
                                            )}
                                        </div>
                                        <label className="cursor-pointer bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors">
                                            Upload
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
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-5">
                                <div>
                                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Primary Color</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={formTheme.primaryColor} onChange={(e) => setFormTheme({ ...formTheme, primaryColor: e.target.value })} className="w-10 h-10 border-2 border-slate-200 cursor-pointer overflow-hidden p-0" />
                                        <span className="text-xs font-mono font-semibold text-slate-600">{formTheme.primaryColor}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Secondary Color</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={formTheme.secondaryColor} onChange={(e) => setFormTheme({ ...formTheme, secondaryColor: e.target.value })} className="w-10 h-10 border-2 border-slate-200 cursor-pointer overflow-hidden p-0" />
                                        <span className="text-xs font-mono font-semibold text-slate-600">{formTheme.secondaryColor}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Accent Color</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={formTheme.accentColor} onChange={(e) => setFormTheme({ ...formTheme, accentColor: e.target.value })} className="w-10 h-10 border-2 border-slate-200 cursor-pointer overflow-hidden p-0" />
                                        <span className="text-xs font-mono font-semibold text-slate-600">{formTheme.accentColor}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-5 border-t border-slate-200 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    className="px-6 py-3 bg-slate-900 text-white font-semibold uppercase tracking-wider text-[10px] hover:bg-slate-800 transition-colors flex items-center gap-2"
                                    disabled={saving}
                                >
                                    {saving ? <RotateCcw className="animate-spin" size={12} /> : <Save size={12} />}
                                    Save Configuration
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
                        <SubscriptionManager />
                    </div>
                )}

            </div>
        </div>
    );
}
