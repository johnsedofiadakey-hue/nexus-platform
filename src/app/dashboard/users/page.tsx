"use client";

import { useState, useEffect } from "react";
import { 
  Users, UserPlus, Shield, MapPin, MoreVertical, 
  Search, CheckCircle2, XCircle, X, Loader2, AlertCircle 
} from "lucide-react";

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "SALES_REP",
    shopId: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const [userRes, shopRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/operations/map-data")
      ]);
      const userData = await userRes.json();
      const shopData = await shopRes.json();
      setUsers(userData);
      setShops(shopData);
    } catch (err) {
      console.error("Failed to sync personnel data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error("Onboarding failed. Check if email is unique.");

      setIsModalOpen(false);
      setFormData({ name: "", email: "", password: "", role: "SALES_REP", shopId: "" });
      fetchData(); // Refresh list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Personnel Directory</h1>
          <p className="text-sm text-slate-500 font-medium">Command and control field operatives across regional nodes.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-blue-200 active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          Onboard Operative
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden mb-8">
        <div className="p-4 bg-slate-50/50 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Filter by name, email, or role..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operative</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assignment</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Deployment</th>
                <th className="p-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                  </td>
                </tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm border border-blue-100">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 tracking-tight">{user.name}</p>
                        <p className="text-[11px] text-slate-400 font-bold">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">{user.shop?.name || "Global Admin"}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{user.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                      user.isSuspended ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.isSuspended ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
                      {user.isSuspended ? 'Suspended' : 'Operational'}
                    </span>
                  </td>
                  <td className="p-5 text-[11px] text-slate-500 font-bold uppercase tracking-tight">
                    {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="p-5 text-right">
                    <button className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                      <MoreVertical className="w-5 h-5 text-slate-300" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ONBOARDING MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg relative z-10 shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">New Operative</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Personnel Onboarding</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleOnboard} className="p-8 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    required
                    type="text" 
                    className="w-full mt-1.5 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      required
                      type="email" 
                      className="w-full mt-1.5 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Password</label>
                    <input 
                      required
                      type="password" 
                      className="w-full mt-1.5 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Level</label>
                    <select 
                      className="w-full mt-1.5 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none appearance-none cursor-pointer"
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value})}
                    >
                      <option value="SALES_REP">Sales Representative</option>
                      <option value="ADMIN">Administrator</option>
                      <option value="SUPER_USER">Super User</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign to Node</label>
                    <select 
                      required
                      className="w-full mt-1.5 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none appearance-none cursor-pointer"
                      value={formData.shopId}
                      onChange={e => setFormData({...formData, shopId: e.target.value})}
                    >
                      <option value="">Select Branch</option>
                      {shops.map(shop => (
                        <option key={shop.id} value={shop.id}>{shop.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Finalize Deployment"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}