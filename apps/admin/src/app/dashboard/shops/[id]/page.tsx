"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronLeft, MapPin, Package, Plus, Trash2, X, Loader2,
  Barcode, ArrowUpCircle, Building2, Search, FileText,
  DollarSign, Download, RefreshCcw, Clock, User, Zap,
  PackageSearch, ChevronDown, ChevronUp, TrendingUp,
  ShoppingCart, CreditCard, Filter, Calendar, Activity
} from "lucide-react";
import { toast } from "react-hot-toast";
import dynamic from "next/dynamic";

type ViewTab = "INVENTORY" | "FIELD_REPORTS" | "SALES";

const GeofenceMap = dynamic(
  () => import("@/components/maps/GeofenceMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center border border-slate-200 rounded-md">
        <Loader2 className="w-5 h-5 text-slate-400 animate-spin mb-2" />
        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Loading Satellite...</span>
      </div>
    )
  }
);

interface DailyReport {
  id: string;
  createdAt: string;
  walkIns: number;
  inquiries: number;
  buyers: number;
  marketIntel?: string;
  stockGaps?: string;
  notes?: string;
  user: { name: string; image?: string; role?: string; shop?: { id?: string; name: string } };
}

interface Sale {
  id: string;
  totalAmount: number;
  amountPaid: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  user: { name: string; image?: string };
  items: { id: string; quantity: number; price: number; product: { name: string; barcode?: string } }[];
}

export default function ShopDetailPortal() {
  const params = useParams();
  const shopId = params?.id as string;

  const [shop, setShop] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [restockingId, setRestockingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<ViewTab>("INVENTORY");

  // Field Reports State
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsFetched, setReportsFetched] = useState(false);
  const [reportSearch, setReportSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Sales State
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesFetched, setSalesFetched] = useState(false);
  const [salesSearch, setSalesSearch] = useState("");
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  // Inventory Modal
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState({
    productName: "", sku: "", priceGHS: "", quantity: "", minStock: "5"
  });

  // FETCH DATA
  const syncHub = useCallback(async () => {
    try {
      if (!shop) setLoading(true);
      const [shopRes, invRes] = await Promise.all([
        fetch(`/api/shops/${shopId}`),
        fetch(`/api/shops/${shopId}/inventory`)
      ]);
      if (!shopRes.ok) throw new Error("Fetch failed");
      const shopData = await shopRes.json();
      const invData = await invRes.json();
      setShop(shopData);
      setInventory(Array.isArray(invData) ? invData : []);
    } catch (e) {
      toast.error("Sync failed");
    } finally {
      setLoading(false);
    }
  }, [shopId, shop]);

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const res = await fetch(`/api/operations/reports?shopId=${shopId}&t=${Date.now()}`);
      const data = await res.json();
      if (data.success) setReports(data.data || []);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setReportsLoading(false);
      setReportsFetched(true);
    }
  };

  const fetchSales = async () => {
    setSalesLoading(true);
    try {
      const res = await fetch(`/api/sales/register?shopId=${shopId}&limit=100&t=${Date.now()}`);
      const data = await res.json();
      setSales(Array.isArray(data) ? data : (data.data || []));
    } catch (error) {
      console.error("Failed to fetch sales:", error);
    } finally {
      setSalesLoading(false);
      setSalesFetched(true);
    }
  };

  useEffect(() => { if (shopId) syncHub(); }, [shopId, syncHub]);

  useEffect(() => {
    if (activeTab === "FIELD_REPORTS" && !reportsFetched) fetchReports();
    if (activeTab === "SALES" && !salesFetched) fetchSales();
  }, [activeTab, reportsFetched, salesFetched]);

  // ACTIONS
  const submitInventory = async () => {
    if (!newItem.productName || !newItem.priceGHS) return toast.error("Name & Price required");
    const t = toast.loading("Saving...");
    try {
      const res = await fetch(`/api/shops/${shopId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: newItem.productName.trim(),
          sku: newItem.sku.trim(),
          priceGHS: newItem.priceGHS,
          quantity: newItem.quantity,
          minStock: newItem.minStock
        })
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Inventory Added", { id: t });
      setShowModal(false);
      setNewItem({ productName: "", sku: "", priceGHS: "", quantity: "", minStock: "5" });
      syncHub();
    } catch (e) { toast.error("Failed", { id: t }); }
  };

  const handleRestock = async (productId: string) => {
    const amountStr = prompt("Units to add:");
    if (!amountStr) return;
    const amount = parseInt(amountStr);
    if (isNaN(amount) || amount <= 0) return;
    setRestockingId(productId);
    try {
      const res = await fetch(`/api/shops/${shopId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESTOCK", productId, amount })
      });
      if (res.ok) { toast.success("Stock Updated"); syncHub(); }
      else { toast.error("Failed"); }
    } finally { setRestockingId(null); }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Permanently delete item?")) return;
    const t = toast.loading("Deleting...");
    try {
      await fetch(`/api/shops/${shopId}/inventory`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      toast.success("Deleted", { id: t });
      syncHub();
    } catch { toast.error("Error", { id: t }); }
  };

  const handleExport = (type: 'reports' | 'sales', format: 'csv') => {
    window.open(`/api/shops/${shopId}/export?type=${type}&format=${format}&shopId=${shopId}`, '_blank');
  };

  // Helpers
  const filteredInventory = inventory.filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReports = reports.filter(r =>
    r.user?.name?.toLowerCase().includes(reportSearch.toLowerCase()) ||
    r.notes?.toLowerCase().includes(reportSearch.toLowerCase())
  );

  const filteredSales = sales.filter(s =>
    s.user?.name?.toLowerCase().includes(salesSearch.toLowerCase()) ||
    s.paymentMethod?.toLowerCase().includes(salesSearch.toLowerCase()) ||
    s.items?.some(i => i.product?.name?.toLowerCase().includes(salesSearch.toLowerCase()))
  );

  const getConversionRate = (walkIns: number, buyers: number) => {
    if (walkIns === 0) return 0;
    return Math.round((buyers / walkIns) * 100);
  };

  const parseIntel = (intelStr?: string) => {
    if (!intelStr) return [];
    try { const p = JSON.parse(intelStr); return Array.isArray(p) ? p : []; } catch { return []; }
  };

  // Sales summary
  const salesTotalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const salesToday = sales.filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString());
  const todayRevenue = salesToday.reduce((sum, s) => sum + s.totalAmount, 0);

  if (loading) return (
    <div className="h-screen w-full bg-white flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-6 h-6 text-slate-900 animate-spin" />
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Hub Data...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900 pb-20">

      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-8 py-5 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-5">
          <Link href="/dashboard/shops" className="p-2.5 -ml-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors">
            <ChevronLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">{shop?.name}</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5 flex items-center gap-2">
              <MapPin size={10} /> {shop?.location || "No Location"}
              <span className="text-slate-300">|</span>
              <span className="text-slate-600">{inventory.length} SKUs</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600">{shop?.staff?.length || 0} Staff</span>
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {activeTab === "FIELD_REPORTS" && (
            <button onClick={() => handleExport('reports', 'csv')} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
              <Download size={14} /> Export CSV
            </button>
          )}
          {activeTab === "SALES" && (
            <button onClick={() => handleExport('sales', 'csv')} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
              <Download size={14} /> Export CSV
            </button>
          )}
          {activeTab === "INVENTORY" && (
            <button onClick={() => setShowModal(true)} className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2">
              <Plus size={14} /> Add Inventory
            </button>
          )}
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto p-8">

        {/* TAB NAVIGATION */}
        <div className="flex items-center gap-2 mb-8 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit">
          <button onClick={() => setActiveTab("INVENTORY")} className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === "INVENTORY" ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}>
            <Package size={16} /> Inventory
            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${activeTab === "INVENTORY" ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>{inventory.length}</span>
          </button>
          <button onClick={() => setActiveTab("FIELD_REPORTS")} className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === "FIELD_REPORTS" ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-500 hover:bg-blue-50 hover:text-blue-600"}`}>
            <FileText size={16} /> Field Reports
            {reports.length > 0 && <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${activeTab === "FIELD_REPORTS" ? "bg-white/20" : "bg-blue-100 text-blue-600"}`}>{reports.length}</span>}
          </button>
          <button onClick={() => setActiveTab("SALES")} className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === "SALES" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"}`}>
            <DollarSign size={16} /> Sales Register
            {sales.length > 0 && <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${activeTab === "SALES" ? "bg-white/20" : "bg-emerald-100 text-emerald-600"}`}>{sales.length}</span>}
          </button>
        </div>

        {/* ============================================= */}
        {/* TAB: INVENTORY                                 */}
        {/* ============================================= */}
        {activeTab === "INVENTORY" && (
          <div className="grid grid-cols-12 gap-8">
            {/* MAP */}
            <div className="col-span-12 lg:col-span-5 h-[600px] flex flex-col space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-1 shadow-sm flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 relative bg-slate-100 rounded-xl overflow-hidden">
                  <GeofenceMap shopLat={shop?.latitude || 5.6037} shopLng={shop?.longitude || -0.1870} shopRadius={shop?.radius || 50} />
                  <div className="absolute top-3 left-3 z-[400] bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                      <Building2 size={12} /> Hub Location
                    </p>
                  </div>
                </div>
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center rounded-b-xl">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Geofence Radius</span>
                  <span className="text-xs font-mono font-bold text-slate-700">{shop?.radius} Meters</span>
                </div>
              </div>
            </div>

            {/* STOCK TABLE */}
            <div className="col-span-12 lg:col-span-7 h-[600px] flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-slate-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Stock Report</span>
                </div>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className="h-8 pl-9 pr-4 bg-white border border-slate-200 rounded-lg text-xs focus:border-blue-500 outline-none w-48 transition-all" placeholder="Search SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 sticky top-0 z-10">
                    <tr>
                      <th className="px-5 py-3 border-b border-slate-200">Item</th>
                      <th className="px-5 py-3 border-b border-slate-200 text-right">Price</th>
                      <th className="px-5 py-3 border-b border-slate-200 text-center">Stock</th>
                      <th className="px-5 py-3 border-b border-slate-200 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInventory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-5 py-3">
                          <p className="font-semibold text-sm text-slate-900">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1"><Barcode size={10} /> {item.barcode}</p>
                        </td>
                        <td className="px-5 py-3 text-right"><p className="font-mono font-bold text-slate-700">&#8373;{(item.sellingPrice || 0).toFixed(2)}</p></td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold border ${item.stockLevel < 5 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>{item.stockLevel} Units</span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleRestock(item.id)} disabled={restockingId === item.id} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors border border-transparent hover:border-blue-100">
                              {restockingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <ArrowUpCircle size={14} />}
                            </button>
                            <button onClick={() => deleteItem(item.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors border border-transparent hover:border-rose-100">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredInventory.length === 0 && (
                      <tr><td colSpan={4} className="py-20 text-center text-slate-400 text-xs font-medium">No inventory records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================= */}
        {/* TAB: FIELD REPORTS                              */}
        {/* ============================================= */}
        {activeTab === "FIELD_REPORTS" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard label="Total Reports" value={reports.length} icon={FileText} color="text-blue-600" bg="bg-blue-50" />
              <StatCard label="Avg Conversion" value={`${reports.length > 0 ? Math.round(reports.reduce((s, r) => s + (r.walkIns > 0 ? (r.buyers / r.walkIns) * 100 : 0), 0) / reports.length) : 0}%`} icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50" />
              <StatCard label="Total Walk-Ins" value={reports.reduce((s, r) => s + r.walkIns, 0)} icon={Activity} color="text-indigo-600" bg="bg-indigo-50" />
              <StatCard label="Intel Reports" value={reports.filter(r => r.marketIntel && r.marketIntel !== '[]').length} icon={Zap} color="text-amber-600" bg="bg-amber-50" />
            </div>

            {/* Search + Refresh */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <Filter size={18} className="text-slate-400" />
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Filter Reports</h2>
                <span className="ml-auto text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full uppercase tracking-widest">
                  {shop?.name}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-2xl">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search by promoter name or notes..." className="w-full h-12 pl-12 pr-4 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-blue-500 transition-all" value={reportSearch} onChange={(e) => setReportSearch(e.target.value)} />
                </div>
                <button onClick={fetchReports} className="h-12 px-5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2">
                  <RefreshCcw size={14} className={reportsLoading ? "animate-spin" : ""} /> Refresh
                </button>
              </div>
            </div>

            {/* Reports Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200"><FileText size={18} /></div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Store Field Reports</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{filteredReports.length} entries for {shop?.name}</p>
                </div>
              </div>

              {reportsLoading ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading reports...</p>
                </div>
              ) : filteredReports.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-left">
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Promoter</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Traffic</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Conversion</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Intel</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-[13px]">
                      {filteredReports.map((report) => (
                        <React.Fragment key={report.id}>
                          <tr className={`hover:bg-slate-50/50 transition-all ${expandedId === report.id ? 'bg-blue-50/30' : ''}`}>
                            <td className="px-8 py-5">
                              <span className="font-black text-slate-900">{new Date(report.createdAt).toLocaleDateString()}</span>
                              <span className="block text-[10px] font-bold text-slate-400"><Clock size={10} className="inline mr-1" />{new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                                  {report.user?.image ? <img src={report.user.image} className="w-full h-full object-cover" alt="" /> : <User size={14} />}
                                </div>
                                <span className="font-black text-slate-900">{report.user?.name}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center justify-center gap-4">
                                <div className="text-center"><p className="text-[9px] font-black text-slate-300 uppercase mb-1">In</p><p className="font-black text-slate-700">{report.walkIns}</p></div>
                                <div className="text-center"><p className="text-[9px] font-black text-slate-300 uppercase mb-1">Buy</p><p className="font-black text-emerald-600">{report.buyers}</p></div>
                              </div>
                            </td>
                            <td className="px-8 py-5 text-center"><div className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black inline-block">{getConversionRate(report.walkIns, report.buyers)}%</div></td>
                            <td className="px-8 py-5">
                              {parseIntel(report.marketIntel).length > 0 ? (
                                <span className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 w-fit"><Zap size={10} /> {parseIntel(report.marketIntel).length} Intel</span>
                              ) : <span className="text-[10px] font-bold text-slate-300">&mdash;</span>}
                            </td>
                            <td className="px-8 py-5 text-right">
                              <button onClick={() => setExpandedId(expandedId === report.id ? null : report.id)} className={`p-2 rounded-xl transition-all ${expandedId === report.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                {expandedId === report.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </td>
                          </tr>
                          {expandedId === report.id && (
                            <tr className="bg-slate-50/30">
                              <td colSpan={6} className="px-12 py-8">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-top-2 duration-300">
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-3 border-b border-slate-200 pb-3"><div className="p-2 bg-amber-100 text-amber-600 rounded-xl"><Zap size={16} /></div><h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Competitor Analysis</h4></div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      {parseIntel(report.marketIntel).length > 0 ? parseIntel(report.marketIntel).map((item: any, idx: number) => (
                                        <div key={idx} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                                          <p className="text-[10px] font-black text-amber-600 uppercase mb-1">{item.brand}</p>
                                          <p className="text-sm font-black text-slate-900 mb-2">{item.model}</p>
                                          <div className="pt-2 border-t border-slate-50 flex justify-between"><span className="text-[10px] font-bold text-slate-400">PRICE</span><span className="text-base font-black text-slate-900">&#8373;{Number(item.price).toLocaleString()}</span></div>
                                        </div>
                                      )) : <div className="col-span-full py-6 text-center bg-white border border-dashed border-slate-200 rounded-2xl"><p className="text-[10px] font-black text-slate-300 uppercase">No Competitor Data</p></div>}
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-3 border-b border-slate-200 pb-3"><div className="p-2 bg-rose-100 text-rose-600 rounded-xl"><PackageSearch size={16} /></div><h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Critical Insights</h4></div>
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                      <p className="text-[9px] font-black text-slate-400 uppercase mb-3">Inventory Gaps</p>
                                      <p className={`text-sm font-medium ${report.stockGaps ? 'text-slate-900' : 'text-slate-300'}`}>{report.stockGaps || "No shortages reported."}</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                      <p className="text-[9px] font-black text-slate-400 uppercase mb-3">Promoter Notes</p>
                                      <p className={`text-sm font-medium italic ${report.notes ? 'text-slate-700' : 'text-slate-300'}`}>&ldquo;{report.notes || "No notes."}&rdquo;</p>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32">
                  <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center text-slate-200 mb-4"><FileText size={32} /></div>
                  <p className="text-sm font-bold text-slate-500 mb-1">No Field Reports</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reports submitted from this store will appear here</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================= */}
        {/* TAB: SALES REGISTER                            */}
        {/* ============================================= */}
        {activeTab === "SALES" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard label="Total Sales" value={sales.length} icon={ShoppingCart} color="text-emerald-600" bg="bg-emerald-50" />
              <StatCard label="Total Revenue" value={`₵${salesTotalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={DollarSign} color="text-blue-600" bg="bg-blue-50" />
              <StatCard label="Today's Sales" value={salesToday.length} icon={Calendar} color="text-indigo-600" bg="bg-indigo-50" />
              <StatCard label="Today Revenue" value={`₵${todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={TrendingUp} color="text-amber-600" bg="bg-amber-50" />
            </div>

            {/* Search */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-2xl">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search by seller, product, or payment method..." className="w-full h-12 pl-12 pr-4 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-emerald-500 transition-all" value={salesSearch} onChange={(e) => setSalesSearch(e.target.value)} />
                </div>
                <button onClick={fetchSales} className="h-12 px-5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2">
                  <RefreshCcw size={14} className={salesLoading ? "animate-spin" : ""} /> Refresh
                </button>
              </div>
            </div>

            {/* Sales Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3">
                <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-200"><DollarSign size={18} /></div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Sales Ledger</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{filteredSales.length} transactions for {shop?.name}</p>
                </div>
              </div>

              {salesLoading ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading sales...</p>
                </div>
              ) : filteredSales.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-left">
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sold By</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Items</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-[13px]">
                      {filteredSales.map((sale) => (
                        <React.Fragment key={sale.id}>
                          <tr className={`hover:bg-slate-50/50 transition-all ${expandedSaleId === sale.id ? 'bg-emerald-50/30' : ''}`}>
                            <td className="px-8 py-5">
                              <span className="font-black text-slate-900">{new Date(sale.createdAt).toLocaleDateString()}</span>
                              <span className="block text-[10px] font-bold text-slate-400"><Clock size={10} className="inline mr-1" />{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                                  {sale.user?.image ? <img src={sale.user.image} className="w-full h-full object-cover" alt="" /> : <User size={14} />}
                                </div>
                                <span className="font-black text-slate-900">{sale.user?.name || 'Unknown'}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${sale.paymentMethod === 'CASH' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : sale.paymentMethod === 'MOMO' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                <CreditCard size={10} className="inline mr-1" />{sale.paymentMethod}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right"><span className="text-base font-black text-slate-900">&#8373;{sale.totalAmount.toFixed(2)}</span></td>
                            <td className="px-8 py-5 text-center"><span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-black">{sale.items?.length || 0}</span></td>
                            <td className="px-8 py-5 text-right">
                              <button onClick={() => setExpandedSaleId(expandedSaleId === sale.id ? null : sale.id)} className={`p-2 rounded-xl transition-all ${expandedSaleId === sale.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                {expandedSaleId === sale.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </td>
                          </tr>
                          {expandedSaleId === sale.id && (
                            <tr className="bg-slate-50/30">
                              <td colSpan={6} className="px-12 py-6">
                                <div className="animate-in slide-in-from-top-2 duration-300">
                                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 mb-4">Sale Items</h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {sale.items?.map((item) => (
                                      <div key={item.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                                        <p className="text-sm font-black text-slate-900">{item.product?.name || 'Unknown Product'}</p>
                                        {item.product?.barcode && <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.product.barcode}</p>}
                                        <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between">
                                          <span className="text-[10px] font-bold text-slate-400">Qty: {item.quantity}</span>
                                          <span className="text-sm font-black text-slate-900">&#8373;{(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status: <span className={sale.status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-600'}>{sale.status}</span></span>
                                    <span className="text-[10px] font-bold text-slate-400">Paid: &#8373;{sale.amountPaid.toFixed(2)} / &#8373;{sale.totalAmount.toFixed(2)}</span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32">
                  <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center text-slate-200 mb-4"><DollarSign size={32} /></div>
                  <p className="text-sm font-bold text-slate-500 mb-1">No Sales Recorded</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sales from this store will appear here</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* INVENTORY MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
              <h2 className="font-bold text-sm uppercase tracking-wider text-slate-800">New SKU Entry</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-rose-600"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Product Name</label>
                <input placeholder="e.g. 42-inch LCD Monitor" className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:border-blue-500 outline-none transition-all" value={newItem.productName} onChange={e => setNewItem({ ...newItem, productName: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SKU / Barcode</label>
                  <input placeholder="Scan..." className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:border-blue-500 outline-none transition-all" value={newItem.sku} onChange={e => setNewItem({ ...newItem, sku: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Price (GHS)</label>
                  <input type="number" placeholder="0.00" className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:border-blue-500 outline-none transition-all" value={newItem.priceGHS} onChange={e => setNewItem({ ...newItem, priceGHS: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Initial Qty</label>
                  <input type="number" placeholder="0" className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:border-blue-500 outline-none transition-all" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Low Alert</label>
                  <input type="number" placeholder="5" className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:border-blue-500 outline-none transition-all" value={newItem.minStock} onChange={e => setNewItem({ ...newItem, minStock: e.target.value })} />
                </div>
              </div>
              <button onClick={submitInventory} className="w-full h-10 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md mt-2">Save to Ledger</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, pulse }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:scale-[1.02] transition-transform">
      <div className={`w-14 h-14 rounded-2xl ${bg} ${color} flex items-center justify-center ${pulse ? 'animate-pulse' : ''}`}><Icon size={24} /></div>
      <div>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-900 tracking-tight leading-none">{value}</p>
      </div>
    </div>
  );
}
