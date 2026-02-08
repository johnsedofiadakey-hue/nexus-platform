"use client";

/**
 * --------------------------------------------------------------------------
 * NEXUS PLATFORM - MOBILE POS TERMINAL
 * VERSION: 25.5.1 (FIXED IMPORTS & PATHS)
 * --------------------------------------------------------------------------
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search, ShoppingCart, Trash2, CheckCircle, Package, LogOut,
  User, Loader2, Home, RefreshCw, ArrowLeft, ArrowRight, Flag, Plus, Minus,
  Store, AlertTriangle, MessageSquare
} from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { processTransaction } from "@/lib/actions/transaction";
import { useMobileData } from "@/context/MobileDataContext";
import { useDebounce } from "@/hooks/useDebounce";
import ProductCard from "@/components/mobile/ProductCard";

export default function MobilePOS() {

  // 🚀 USE CONTEXT FOR SHARED DATA
  const { identity, inventory, loading, error, refreshInventory, updateInventoryItem } = useMobileData();

  // Cart & View State
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300); // 🔍 Debounced search
  const [view, setView] = useState<'BROWSE' | 'CHECKOUT' | 'SUCCESS'>('BROWSE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSaleId, setLastSaleId] = useState("");

  // --- CART LOGIC ---
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newPrice, setNewPrice] = useState("");
  const [priceReason, setPriceReason] = useState("");
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

  // 🔄 SHOP REASSIGNMENT TRACKING: Clear cart when assigned to different shop
  const previousShopId = React.useRef<string | null>(null);
  
  useEffect(() => {
    if (identity?.shopId) {
      if (previousShopId.current && previousShopId.current !== identity.shopId) {
        // Shop changed - clear cart for safety
        setCart([]);
        setView('BROWSE');
        toast.info(`📦 Cart cleared - Now serving: ${identity.shopName}`, {
          duration: 4000
        });
      }
      previousShopId.current = identity.shopId;
    }
  }, [identity?.shopId, identity?.shopName]);

  const addToCart = useCallback((product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      const currentQty = existing ? existing.cartQty : 0;
      const availableStock = product.stockLevel ?? product.quantity ?? 0;

      if (currentQty + 1 > availableStock) {
        toast.error(`Stock Limit! Only ${availableStock} available.`, { duration: 2000 });
        return prev;
      }

      // 🚀 OPTIMISTIC UPDATE: Update cart immediately
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, cartQty: item.cartQty + 1 } : item);
      }
      return [...prev, { ...product, cartQty: 1 }];
    });
    
    // No API call needed - cart is local state
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    // 🚀 OPTIMISTIC UPDATE: Remove immediately
    setCart(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const updateQty = useCallback((itemId: string, delta: number) => {
    // 🚀 OPTIMISTIC UPDATE: Update quantity immediately
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = item.cartQty + delta;
        const availableStock = item.stockLevel ?? item.quantity ?? 0;
        if (newQty > availableStock) return item;
        if (newQty < 1) return item;
        return { ...item, cartQty: newQty };
      }
      return item;
    }));
  }, []);

  const handlePriceUpdate = async () => {
    if (!editingItem || !newPrice || !priceReason) return;
    setIsUpdatingPrice(true);
    try {
      const res = await fetch('/api/products/update-price', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: editingItem.id,
          newPrice: parseFloat(newPrice),
          reason: priceReason
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Update local cart
        setCart(prev => prev.map(item =>
          item.id === editingItem.id ? { ...item, priceGHS: data.data.sellingPrice } : item
        ));
        // Update inventory (optimistic)
        updateInventoryItem(editingItem.id, { priceGHS: data.data.sellingPrice });
        toast.success("Price updated successfully.");
        setEditingItem(null);
        setNewPrice("");
        setPriceReason("");
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to update price.");
      }
    } catch (e) {
      toast.error("Network error.");
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  // --- CHECKOUT LOGIC ---
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!identity || !identity.id || !identity.shopId) {
      toast.error("Terminal Out of Sync. Please refresh.");
      return;
    }
    setIsProcessing(true);

    try {
      // 📍 OPTIMIZED GPS: Non-blocking with cache fallback
      let gps = { lat: 0, lng: 0 };
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          // Try to get cached GPS first for instant checkout
          const cached = localStorage.getItem('nexus_last_gps');
          if (cached) {
            const parsed = JSON.parse(cached);
            const age = Date.now() - parsed.timestamp;
            // Use cache if less than 10 minutes old
            if (age < 10 * 60 * 1000) {
              gps = { lat: parsed.lat, lng: parsed.lng };
            }
          }

          // Try fresh GPS (non-blocking, shorter timeout)
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { 
              timeout: 5000,
              maximumAge: 15000, // Accept only 15-second old position for accuracy
              enableHighAccuracy: true // Accurate location for sales records
            });
          });
          gps = { lat: position.coords.latitude, lng: position.coords.longitude };
          // Cache for next time
          localStorage.setItem('nexus_last_gps', JSON.stringify({
            lat: gps.lat,
            lng: gps.lng,
            timestamp: Date.now()
          }));
        } catch (e) { 
          console.log("GPS unavailable - proceeding with cached/default coordinates");
        }
      }

      const payloadItems = cart.map(i => ({
        productId: i.id,
        quantity: i.cartQty,
        price: i.priceGHS
      }));

      // ⚡️ SERVER ACTION INVOCATION
      const result = await processTransaction(
        identity.id,
        identity.shopId,
        cartTotal,
        payloadItems,
        "CASH"
      );

      if (result.success) {
        setLastSaleId(result.saleId);
        setView('SUCCESS');
        setCart([]);
        // Background inventory refresh
        refreshInventory();
        // Show success toast
        toast.success(`Sale recorded: ₵${cartTotal.toLocaleString()}`);
      } else {
        // 🎯 IMPROVED ERROR HANDLING
        const errorMsg = (result as any).error || 'Unknown error';
        
        // Specific error handling
        if (errorMsg.includes('Out of Stock')) {
          toast.error(`⚠️ Stock Issue: ${errorMsg}`, {
            duration: 6000,
            icon: '📦'
          });
        } else if (errorMsg.includes('Product Not Found')) {
          toast.error('Product not found. Please refresh inventory.', {
            duration: 5000,
            icon: '🔍'
          });
        } else if (errorMsg.includes('Invalid Data')) {
          toast.error('Invalid transaction data. Please try again.', {
            duration: 5000
          });
        } else {
          toast.error(`Transaction failed: ${errorMsg}`, {
            duration: 6000
          });
        }
      }

    } catch (err: any) {
      console.error('Checkout error:', err);
      
      // Better network error handling
      if (err.message?.includes('fetch') || err.message?.includes('network')) {
        toast.error('Network error. Check your connection and try again.', {
          duration: 5000,
          icon: '📡'
        });
      } else {
        toast.error(err.message || 'Unexpected error. Please try again.', {
          duration: 5000
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // --- RENDER STATES ---
  if (loading && !identity) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Terminal...</p>
      </div>
    );
  }

  if (error === "NO_SHOP_ASSIGNED") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-6 px-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-500">
          <Store className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">Access Denied</h2>
          <p className="text-sm text-slate-500 mt-2 font-medium">You are not assigned to a Shop.</p>
          <p className="text-xs text-slate-400 mt-1">Please contact HQ to link your profile.</p>
        </div>
        <Link href="/mobilepos" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // 🎯 MEMOIZED FILTERED PRODUCTS - Only recomputes when inventory or search changes
  const filteredProducts = useMemo(() => {
    if (!debouncedSearch) return inventory;
    const search = debouncedSearch.toLowerCase();
    return inventory.filter(p =>
      (p.productName || p.name || "").toLowerCase().includes(search) ||
      (p.sku && p.sku.toLowerCase().includes(search))
    );
  }, [inventory, debouncedSearch]);

  // 🎯 MEMOIZED CART TOTAL
  const cartTotal = useMemo(() => 
    cart.reduce((sum, item) => sum + (item.priceGHS * item.cartQty), 0),
    [cart]
  );

  return (
    <div className="min-h-screen flex flex-col pb-24 bg-slate-50 text-slate-900 font-sans">
      {/* PRICE EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-900 mb-2">Adjust Price</h3>
            <p className="text-xs text-slate-400 font-bold uppercase mb-6 tracking-wide">{editingItem.productName}</p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">New Price (GHS)</label>
                <input
                  type="number"
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500"
                  value={newPrice}
                  onChange={e => setNewPrice(e.target.value)}
                  placeholder="e.g. 150"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Reason for Change</label>
                <textarea
                  className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500 resize-none"
                  value={priceReason}
                  onChange={e => setPriceReason(e.target.value)}
                  placeholder="e.g. Bulk discount, seasonal promo..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePriceUpdate}
                  disabled={isUpdatingPrice || !newPrice || !priceReason}
                  className="flex-2 py-4 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                >
                  {isUpdatingPrice ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Change"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="px-6 pt-8 pb-4 bg-white shadow-sm border-b border-slate-100 mb-4 sticky top-0 z-20">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
              {identity?.shopName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <User className="w-3 h-3 text-blue-500" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{identity?.agentName}</p>
            </div>
            {identity?.managerName && (
              <div className="flex items-center gap-2 mt-0.5">
                <Store className="w-3 h-3 text-slate-400" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Mgr: {identity.managerName} <span className="text-slate-300">•</span> {identity.managerPhone}
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={fetchData} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors active:scale-90">
              <RefreshCw className="w-4 h-4" />
            </button>
            <Link href="/mobilepos/history" className="p-2 bg-slate-50 text-slate-500 rounded-full hover:bg-slate-100 transition-colors active:scale-90" title="Sales History">
              <span className="sr-only">History</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /></svg>
            </Link>
            <Link href="/mobilepos" className="p-2 bg-slate-50 text-slate-500 rounded-full hover:bg-slate-100 transition-colors active:scale-90">
              <Home className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 🎯 SALES TARGET PROGRESS CARD */}
      {identity?.targetProgress && (
        <div className="px-6 mb-6 animate-in slide-in-from-top-4 duration-700 delay-100">
          <div className="bg-slate-900 rounded-3xl p-5 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Monthly Sales Target</h3>
                <p className="text-lg font-black mt-1">
                  {Math.round((identity.targetProgress.achievedValue / identity.targetProgress.targetValue) * 100)}%
                  <span className="text-xs text-slate-500 font-bold ml-2">Completed</span>
                </p>
              </div>
              <Flag className="w-5 h-5 text-blue-500" />
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase">Revenue</p>
                <p className="text-sm font-bold">₵ {identity.targetProgress.achievedValue.toLocaleString()} <span className="text-slate-600">/ {identity.targetProgress.targetValue.toLocaleString()}</span></p>
                <div className="h-1.5 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((identity.targetProgress.achievedValue / identity.targetProgress.targetValue) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase">Volume</p>
                <p className="text-sm font-bold">{identity.targetProgress.achievedQuantity} <span className="text-slate-600">/ {identity.targetProgress.targetQuantity}</span></p>
                <div className="h-1.5 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((identity.targetProgress.achievedQuantity / identity.targetProgress.targetQuantity) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          </div>
        </div>
      )}

      {/* VIEW: BROWSE */}
      {view === 'BROWSE' && (
        <div className="px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input
              placeholder="Search SKU or Name..."
              className="w-full h-12 pl-12 pr-4 rounded-xl text-sm font-bold outline-none border border-slate-200 bg-white focus:border-blue-500 transition-all shadow-sm placeholder:text-slate-300"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => {
                const inCart = cart.find(c => c.id === product.id);
                const isOutOfStock = product.quantity <= 0;

                return (
                  <div key={product.id} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isOutOfStock ? "bg-slate-100 text-slate-300" : "bg-blue-50 text-blue-600"}`}>
                          <Package className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-black text-sm text-slate-900">{product.productName}</h3>
                          <div className="flex gap-2 items-center">
                            <span className={`text-[10px] font-bold uppercase ${isOutOfStock ? "text-red-500" : "text-emerald-500"}`}>
                              {isOutOfStock ? "Out of Stock" : `${product.quantity} Available`}
                            </span>
                          </div>
                          <p className="font-bold text-xs mt-1 text-slate-700">₵ {product.priceGHS.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="w-full">
                      {inCart ? (
                        <div className="flex items-center justify-between bg-slate-100 rounded-xl p-1">
                          <button onClick={() => updateQty(product.id, -1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 font-bold active:scale-90 transition-transform"><Minus className="w-4 h-4" /></button>
                          <span className="text-sm font-black text-slate-900">{inCart.cartQty}</span>
                          <button onClick={() => updateQty(product.id, 1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 font-bold active:scale-90 transition-transform"><Plus className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <button
                          disabled={isOutOfStock}
                          onClick={() => addToCart(product)}
                          className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wide transition-all active:scale-95 ${isOutOfStock
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700"
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
                <p className="text-xs text-slate-400 mt-1">Try a different search term.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: CHECKOUT */}
      {view === 'CHECKOUT' && (
        <div className="flex flex-col h-full px-6 animate-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setView('BROWSE')} className="p-2 bg-white border border-slate-200 rounded-full text-slate-500 hover:text-slate-900 active:scale-90 transition-transform">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-black text-slate-900">Review Order</h1>
          </div>

          <div className="flex-1 space-y-4">
            {cart.map(item => (
              <div key={item.id} className="p-4 rounded-2xl border border-slate-200 bg-white flex justify-between items-center shadow-sm">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-sm text-slate-900">{item.productName}</h4>
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setNewPrice(item.priceGHS.toString());
                      }}
                      className="p-1 px-2 border border-blue-100 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                    >
                      Edit Price
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 font-bold">₵ {item.priceGHS} x {item.cartQty}</p>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <p className="font-black text-sm text-slate-900">₵ {(item.priceGHS * item.cartQty).toLocaleString()}</p>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-500 active:scale-90 transition-transform">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 rounded-3xl bg-white border border-slate-200 shadow-xl mb-8">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total</span>
              <span className="text-3xl font-black text-slate-900">₵ {cartTotal.toLocaleString()}</span>
            </div>

            <button
              disabled={isProcessing}
              onClick={handleCheckout}
              className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 disabled:opacity-50 bg-emerald-600 flex items-center justify-center gap-2 hover:bg-emerald-700"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                `SELL ${cart.length} ITEM${cart.length > 1 ? 'S' : ''} • ₵ ${cartTotal.toLocaleString()}`
              )}
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

          <div className="bg-white p-4 rounded-2xl border border-slate-200 w-full max-w-xs mb-8 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Synced To</p>
            <p className="text-sm font-black text-slate-900">{identity?.shopName}</p>
          </div>

          <button onClick={() => setView('BROWSE')} className="w-full py-4 rounded-xl text-white font-black text-xs uppercase tracking-widest shadow-lg bg-blue-600 active:scale-95 transition-transform hover:bg-blue-700">
            Next Customer
          </button>
        </div>
      )}

      {/* VIEW: BROWSE - FLOATING CHECKOUT BAR */}
      {view === 'BROWSE' && cart.length > 0 && (
        <div className="fixed bottom-24 left-6 right-6 z-30 animate-in slide-in-from-bottom-10 duration-500">
          <button
            onClick={() => setView('CHECKOUT')}
            className="w-full bg-slate-900 border border-slate-800 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-black text-sm">
                {cart.reduce((a, b) => a + b.cartQty, 0)}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Review Order</p>
                <p className="text-sm font-black">Checkout Now</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pr-2">
              <span className="text-lg font-black text-blue-400">₵ {cartTotal.toLocaleString()}</span>
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
          </button>
        </div>
      )}

    </div>
  );
}