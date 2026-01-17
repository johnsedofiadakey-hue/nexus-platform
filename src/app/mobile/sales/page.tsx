"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, ShoppingCart, Plus, Minus, Trash2, 
  CreditCard, CheckCircle, Package, LogOut, 
  Store, User, Loader2, Home, RefreshCw
} from "lucide-react";
import { signOut } from "next-auth/react";

export default function MobileSales() {
  
  // --- STATE ---
  // Identity is initialized empty to prevent "Kojo" flashing
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
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/inventory?t=" + Date.now()); // Prevent caching
      const data = await res.json();

      if (res.ok) {
        setIdentity({ agentName: data.agentName, shopName: data.shopName });
        setInventory(data.items || []);
      } else {
        // If unauthorized, redirect to login
        if (res.status === 401) signOut({ callbackUrl: '/login' });
        setError(data.error || "Failed to load shop data");
      }
    } catch (e) {
      setError("Network Connection Error");
    } finally {
      setLoading(false);
    }
  };

  // --- CART LOGIC ---
  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      const currentQty = existing ? existing.cartQty : 0;
      
      if (currentQty + 1 > product.quantity) {
        alert("Maximum stock reached for this item.");
        return prev;
      }

      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, cartQty: item.cartQty + 1 } : item);
      }
      return [...prev, { ...product, cartQty: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.cartQty + delta;
        if (newQty > item.quantity) return item; 
        if (newQty < 1) return item;
        return { ...item, cartQty: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.priceGHS * item.cartQty), 0);

  // --- CHECKOUT LOGIC ---
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      // Get GPS (Optional but good for tracking)
      let gps = { lat: 0, lng: 0 };
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
          });
          gps = { lat: position.coords.latitude, lng: position.coords.longitude };
        } catch (e) { console.log("GPS Timeout"); }
      }

      const payload = {
        items: cart.map(i => ({ productId: i.id, quantity: i.cartQty, price: i.priceGHS })),
        totalAmount: cartTotal,
        gps
      };

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
        fetchShopData(); // Refresh inventory
      } else {
        alert(`Sale Failed: ${data.error}`);
      }

    } catch (err) {
      alert("Network Error: Check internet connection");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- LOADING VIEW ---
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Authenticating Agent...</p>
      </div>
    );
  }

  // --- ERROR VIEW ---
  if (error || !identity) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <Store className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">Access Issue</h2>
        <p className="text-sm text-slate-500 mb-8">{error || "Could not identify staff member."}</p>
        <button onClick={() => signOut({ callbackUrl: '/login' })} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest">
          Sign Out & Retry
        </button>
      </div>
    );
  }

  // --- FILTERING ---
  const filteredProducts = inventory.filter(p => p.productName.toLowerCase().includes(searchTerm.toLowerCase()));

  // --- RENDER MAIN UI ---
  return (
    <div className="min-h-screen flex flex-col pb-24 bg-slate-50 text-slate-900">
      
      {/* HEADER */}
      <div className="px-6 pt-8 pb-4 bg-white shadow-sm border-b border-slate-100 mb-4 sticky top-0 z-10">
        <div className="flex justify-between items-start">
          <div>
             <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
               {identity.shopName || "No Shop Assigned"}
             </h1>
             <div className="flex items-center gap-2 mt-1">
               <User className="w-3 h-3 text-blue-500" />
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{identity.agentName}</p>
             </div>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchShopData} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors">
               <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors">
               <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* VIEW: BROWSE INVENTORY */}
      {view === 'BROWSE' && (
        <div className="px-6">
          {/* SEARCH */}
          <div className="relative mb-6">
             <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
             <input 
               placeholder="Search products..."
               className="w-full h-12 pl-12 pr-4 rounded-xl text-sm font-bold outline-none border border-slate-200 bg-white focus:border-blue-500 transition-all shadow-sm"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
          </div>

          {/* GRID */}
          <div className="space-y-4">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => {
                const inCart = cart.find(c => c.id === product.id);
                const isOutOfStock = product.quantity <= 0;

                return (
                  <div key={product.id} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-between">
                     <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isOutOfStock ? "bg-slate-100 text-slate-300" : "bg-blue-50 text-blue-600"}`}>
                         <Package className="w-6 h-6" />
                       </div>
                       <div>
                         <h3 className="font-black text-sm text-slate-900">{product.productName}</h3>
                         <p className={`text-xs font-bold ${isOutOfStock ? "text-red-500" : "text-slate-400"}`}>
                           {isOutOfStock ? "Out of Stock" : `Available: ${product.quantity}`}
                         </p>
                         <p className="font-bold text-xs mt-1 text-emerald-600">₵ {product.priceGHS.toFixed(2)}</p>
                       </div>
                     </div>

                     {inCart ? (
                       <div className="flex items-center gap-3 bg-slate-100 rounded-lg p-1">
                          <button onClick={() => updateQty(product.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-600 font-bold active:scale-90">-</button>
                          <span className="text-sm font-black text-slate-900 w-4 text-center">{inCart.cartQty}</span>
                          <button onClick={() => updateQty(product.id, 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-600 font-bold active:scale-90">+</button>
                       </div>
                     ) : (
                       <button 
                         disabled={isOutOfStock}
                         onClick={() => addToCart(product)}
                         className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all active:scale-95 ${
                           isOutOfStock 
                           ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                           : "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                         }`}
                       >
                         Add
                       </button>
                     )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                  <Package className="w-8 h-8" />
                </div>
                <p className="text-slate-500 font-bold text-sm">No inventory found.</p>
                <p className="text-slate-400 text-xs mt-1 max-w-[200px]">Ask Admin to add products to your assigned shop.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: CHECKOUT */}
      {view === 'CHECKOUT' && (
        <div className="flex flex-col h-full px-6">
           <div className="flex items-center gap-4 mb-6">
             <button onClick={() => setView('BROWSE')} className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
               <ArrowLeft className="w-4 h-4" /> Back
             </button>
             <h1 className="text-xl font-black text-slate-900">Review Sale</h1>
           </div>

           <div className="flex-1 space-y-4">
              {cart.map(item => (
                <div key={item.id} className="p-4 rounded-2xl border border-slate-200 bg-white flex justify-between items-center shadow-sm">
                   <div>
                     <h4 className="font-bold text-sm text-slate-900">{item.productName}</h4>
                     <p className="text-xs text-slate-400 font-bold">₵ {item.priceGHS} x {item.cartQty}</p>
                   </div>
                   <div className="flex items-center gap-4">
                     <p className="font-black text-sm text-slate-900">₵ {(item.priceGHS * item.cartQty).toFixed(2)}</p>
                     <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-500">
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                </div>
              ))}
           </div>

           <div className="mt-8 p-6 rounded-3xl bg-white border border-slate-200 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-bold text-slate-500 uppercase">Total</span>
                <span className="text-3xl font-black text-slate-900">₵ {cartTotal.toFixed(2)}</span>
              </div>
              
              <button 
                disabled={isProcessing}
                onClick={handleCheckout}
                className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-600 flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Payment"}
              </button>
           </div>
        </div>
      )}

      {/* VIEW: SUCCESS */}
      {view === 'SUCCESS' && (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
           <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30 mb-8 animate-in zoom-in duration-500">
              <CheckCircle className="w-10 h-10 text-white" />
           </div>
           <h2 className="text-3xl font-black mb-2 text-slate-900">Sale Confirmed!</h2>
           <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mb-8">Ref: #{lastSaleId.slice(-6).toUpperCase()}</p>
           
           <div className="flex gap-4 w-full">
             <button onClick={() => setView('BROWSE')} className="flex-1 py-4 rounded-xl text-white font-black text-xs uppercase tracking-widest shadow-lg bg-blue-600">
               New Sale
             </button>
           </div>
        </div>
      )}

      {/* BOTTOM NAV (Only visible in BROWSE to prevent clutter) */}
      {view === 'BROWSE' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex justify-around items-center z-50">
           <button onClick={() => window.location.reload()} className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-600 transition-colors">
             <Home className="w-5 h-5" />
             <span className="text-[10px] font-bold uppercase">Home</span>
           </button>
           
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