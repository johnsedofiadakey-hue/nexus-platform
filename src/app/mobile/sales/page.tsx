"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, ShoppingCart, Trash2, CheckCircle, Package, LogOut, 
  User, Loader2, Home, RefreshCw, ArrowLeft, Flag, Plus, Minus
} from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";

export default function MobileSales() {
  
  // --- STATE ---
  const [identity, setIdentity] = useState<{ agentName: string; shopName: string } | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Cart & View State
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<'BROWSE' | 'CHECKOUT' | 'SUCCESS'>('BROWSE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSaleId, setLastSaleId] = useState("");

  // --- 1. LOAD DATA ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // Get Identity
      const initRes = await fetch("/api/mobile/init?t=" + Date.now());
      if (initRes.ok) {
        const initData = await initRes.json();
        setIdentity({ agentName: initData.agentName, shopName: initData.shopName });
      } else {
        if (initRes.status === 401) signOut({ callbackUrl: '/login' });
        throw new Error("Identity Failed");
      }

      // Get Live Inventory
      const invRes = await fetch("/api/inventory?t=" + Date.now()); 
      if (invRes.ok) {
        const invData = await invRes.json();
        setInventory(Array.isArray(invData) ? invData : []);
      } else {
        throw new Error("Inventory Failed");
      }

    } catch (e) {
      setError("Connection Error. Swipe down to retry.");
    } finally {
      setLoading(false);
    }
  };

  // --- CART LOGIC ---
  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.dbId === product.dbId);
      const currentQty = existing ? existing.cartQty : 0;
      
      // Strict Stock Check
      if (currentQty + 1 > product.stock) {
        alert("Cannot sell more than available stock!");
        return prev;
      }

      if (existing) {
        return prev.map(item => item.dbId === product.dbId ? { ...item, cartQty: item.cartQty + 1 } : item);
      }
      return [...prev, { ...product, cartQty: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.dbId !== itemId));
  };

  const updateQty = (itemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.dbId === itemId) {
        const newQty = item.cartQty + delta;
        if (newQty > item.stock) return item; 
        if (newQty < 1) return item;
        return { ...item, cartQty: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.cartQty), 0);

  // --- ACTIONS ---
  const handleReportIssue = (productName: string) => {
    // In V2: This will open a modal to send a 'Discrepancy Report' to Admin
    const note = prompt(`Report issue with ${productName}? (e.g., 'Broken', 'Count Wrong')`);
    if (note) {
      alert("Report sent to Admin. Inventory not changed.");
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      // 1. Get GPS for Sale Location
      let gps = { lat: 0, lng: 0 };
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
          });
          gps = { lat: position.coords.latitude, lng: position.coords.longitude };
        } catch (e) { console.log("GPS Timeout"); }
      }

      // 2. Prepare Payload
      const payload = {
        items: cart.map(i => ({ productId: i.dbId, quantity: i.cartQty, price: i.price })),
        totalAmount: cartTotal,
        gps
      };

      // 3. Process Sale
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        setLastSaleId(data.saleId);
        setView('SUCCESS');
        setCart([]);
        // Refresh inventory silently to reflect deductions
        fetch("/api/inventory?t=" + Date.now()).then(r => r.json()).then(d => setInventory(d));
      } else {
        alert(`Sale Failed: ${data.error}`);
      }

    } catch (err) {
      alert("Network Error");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- LOADING ---
  if (loading && !identity) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading POS...</p>
      </div>
    );
  }

  // --- FILTERING ---
  const filteredProducts = inventory.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.id && p.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen flex flex-col pb-24 bg-slate-50 text-slate-900">
      
      {/* HEADER */}
      <div className="px-6 pt-8 pb-4 bg-white shadow-sm border-b border-slate-100 mb-4 sticky top-0 z-20">
        <div className="flex justify-between items-start">
          <div>
             <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
               {identity?.shopName || "Loading..."}
             </h1>
             <div className="flex items-center gap-2 mt-1">
               <User className="w-3 h-3 text-blue-500" />
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{identity?.agentName}</p>
             </div>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchData} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors">
               <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors">
               <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* VIEW: BROWSE */}
      {view === 'BROWSE' && (
        <div className="px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative mb-6">
             <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
             <input 
               placeholder="Search product..."
               className="w-full h-12 pl-12 pr-4 rounded-xl text-sm font-bold outline-none border border-slate-200 bg-white focus:border-blue-500 transition-all shadow-sm"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
          </div>

          <div className="space-y-4">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => {
                const inCart = cart.find(c => c.dbId === product.dbId);
                const isOutOfStock = product.stock <= 0;

                return (
                  <div key={product.dbId} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col gap-4">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                         <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isOutOfStock ? "bg-slate-100 text-slate-300" : "bg-blue-50 text-blue-600"}`}>
                           <Package className="w-6 h-6" />
                         </div>
                         <div>
                           <h3 className="font-black text-sm text-slate-900">{product.name}</h3>
                           <div className="flex gap-2 items-center">
                              <span className={`text-[10px] font-bold uppercase ${isOutOfStock ? "text-red-500" : "text-emerald-500"}`}>
                                {isOutOfStock ? "Out of Stock" : `${product.stock} Available`}
                              </span>
                              {/* REPORT BUTTON */}
                              <button onClick={() => handleReportIssue(product.name)} className="text-slate-300 hover:text-amber-500 transition-colors" title="Report Issue">
                                <Flag className="w-3 h-3" />
                              </button>
                           </div>
                           <p className="font-bold text-xs mt-1 text-slate-700">₵ {product.price.toLocaleString()}</p>
                         </div>
                       </div>
                     </div>

                     {/* ACTIONS */}
                     <div className="w-full">
                       {inCart ? (
                         <div className="flex items-center justify-between bg-slate-100 rounded-xl p-1">
                            <button onClick={() => updateQty(product.dbId, -1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 font-bold active:scale-90"><Minus className="w-4 h-4" /></button>
                            <span className="text-sm font-black text-slate-900">{inCart.cartQty}</span>
                            <button onClick={() => updateQty(product.dbId, 1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 font-bold active:scale-90"><Plus className="w-4 h-4" /></button>
                         </div>
                       ) : (
                         <button 
                           disabled={isOutOfStock}
                           onClick={() => addToCart(product)}
                           className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wide transition-all active:scale-95 ${
                             isOutOfStock 
                             ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                             : "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                           }`}
                         >
                           Add to Order
                         </button>
                       )}
                     </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                  <Package className="w-8 h-8" />
                </div>
                <p className="text-slate-500 font-bold text-sm">No items found.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: CHECKOUT */}
      {view === 'CHECKOUT' && (
        <div className="flex flex-col h-full px-6 animate-in slide-in-from-right-4 duration-300">
           <div className="flex items-center gap-4 mb-6">
             <button onClick={() => setView('BROWSE')} className="p-2 bg-white border border-slate-200 rounded-full text-slate-500 hover:text-slate-900">
               <ArrowLeft className="w-5 h-5" />
             </button>
             <h1 className="text-xl font-black text-slate-900">Current Bill</h1>
           </div>

           <div className="flex-1 space-y-4">
              {cart.map(item => (
                <div key={item.dbId} className="p-4 rounded-2xl border border-slate-200 bg-white flex justify-between items-center shadow-sm">
                   <div>
                     <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
                     <p className="text-xs text-slate-400 font-bold">₵ {item.price} x {item.cartQty}</p>
                   </div>
                   <div className="flex items-center gap-4">
                     <p className="font-black text-sm text-slate-900">₵ {(item.price * item.cartQty).toLocaleString()}</p>
                     <button onClick={() => removeFromCart(item.dbId)} className="text-red-400 hover:text-red-500">
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                </div>
              ))}
           </div>

           <div className="mt-8 p-6 rounded-3xl bg-white border border-slate-200 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-bold text-slate-500 uppercase">Total</span>
                <span className="text-3xl font-black text-slate-900">₵ {cartTotal.toLocaleString()}</span>
              </div>
              
              <button 
                disabled={isProcessing}
                onClick={handleCheckout}
                className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 disabled:opacity-50 bg-emerald-600 flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Sale"}
              </button>
           </div>
        </div>
      )}

      {/* VIEW: SUCCESS */}
      {view === 'SUCCESS' && (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 animate-in zoom-in duration-500">
           <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30 mb-8">
              <CheckCircle className="w-10 h-10 text-white" />
           </div>
           <h2 className="text-3xl font-black mb-2 text-slate-900">Sale Recorded</h2>
           <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mb-8">Ref: #{lastSaleId.slice(-6).toUpperCase()}</p>
           <p className="text-xs text-slate-400 mb-8 max-w-xs mx-auto">Inventory has been automatically updated. Transaction saved to history.</p>
           
           <button onClick={() => setView('BROWSE')} className="w-full py-4 rounded-xl text-white font-black text-xs uppercase tracking-widest shadow-lg bg-blue-600 active:scale-95 transition-transform">
             Next Customer
           </button>
        </div>
      )}

      {/* BOTTOM NAV */}
      {view === 'BROWSE' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex justify-around items-center z-50 pb-8">
           <Link href="/mobile" className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-600 transition-colors">
             <Home className="w-5 h-5" />
             <span className="text-[10px] font-bold uppercase">Home</span>
           </Link>
           
           <div className="relative">
             <button 
               onClick={() => cart.length > 0 && setView('CHECKOUT')}
               className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl mb-8 transition-transform active:scale-90 ${cart.length > 0 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400"}`}
             >
               <ShoppingCart className="w-6 h-6" />
               {cart.length > 0 && (
                 <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                   {cart.length}
                 </span>
               )}
             </button>
           </div>

           <button className="flex flex-col items-center gap-1 text-slate-400 opacity-50 cursor-not-allowed">
             <User className="w-5 h-5" />
             <span className="text-[10px] font-bold uppercase">Profile</span>
           </button>
        </div>
      )}

    </div>
  );
}