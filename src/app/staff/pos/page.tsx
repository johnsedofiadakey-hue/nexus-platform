"use client";

import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Scan, ShoppingCart, MapPin, Loader2, PackageOpen } from 'lucide-react';
import { checkGeofence } from '@/lib/sentinel';
import { submitSaleAction } from '@/lib/actions/sales-engine';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

export default function StaffPOS() {
  const { data: session } = useSession();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isInside, setIsInside] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Shop Data should ideally be fetched from the session or a shop API
  // Using coordinates provided in the blueprint for Accra Mall
  const shopData = {
    lat: 5.6037,
    lng: -0.1870,
    radius: 100
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });

        const inside = checkGeofence(latitude, longitude, shopData.lat, shopData.lng, shopData.radius);
        setIsInside(inside);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        toast.error("GPS Signal Lost. Move to an open area.");
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [shopData.lat, shopData.lng, shopData.radius]);

  const handleCompleteSale = async () => {
    if (!isInside || !location) {
      toast.error("ACCESS DENIED: Outside shop boundaries.");
      return;
    }

    if (!session?.user?.id || !session?.user?.shopId) {
      toast.error("Session Error: Re-login required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const saleData = {
        staffId: session.user.id,
        shopId: session.user.shopId,
        location: { lat: location.lat, lng: location.lng },
        items: [
          { productId: 'p1', qty: 1, price: 450.00, name: 'Nexus Premium Unit' }
        ]
      };

      const response = await submitSaleAction(saleData);

      if (response.success) {
        toast.success("Transaction Secured & Inventory Updated", {
          icon: '✅',
          style: { borderRadius: '15px', background: '#333', color: '#fff' }
        });
        // You could reset a local cart state here
      } else {
        toast.error(response.error || "Transaction Failed");
      }
    } catch (error) {
      toast.error("Critical Engine Error. Contact StormGlide Support.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
        <h2 className="font-black tracking-widest animate-pulse">NEXUS SENTINEL INITIALIZING</h2>
        <p className="text-slate-500 text-xs mt-2 uppercase">Verifying Geospace & Security</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-24">
      {/* Header Status */}
      <div className={`flex items-center justify-between p-5 rounded-[2rem] mb-6 shadow-xl border-2 transition-colors duration-500 ${isInside ? 'bg-white border-emerald-500' : 'bg-rose-50 border-rose-200'}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl shadow-lg ${isInside ? 'bg-emerald-500 shadow-emerald-200' : 'bg-rose-500 shadow-rose-200'} text-white`}>
            {isInside ? <ShieldCheck size={28} /> : <ShieldAlert size={28} />}
          </div>
          <div>
            <h2 className={`text-lg font-black leading-tight ${isInside ? 'text-slate-900' : 'text-rose-800'}`}>
              {isInside ? 'SYSTEM ACTIVE' : 'LOCKED'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <MapPin size={12} className={isInside ? 'text-emerald-500' : 'text-rose-500'} />
              {isInside ? 'Authorized Zone' : 'Unauthorized Area'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase font-black text-slate-300">Staff Hash</p>
          <p className="font-mono text-xs text-slate-600">ID-{session?.user?.id?.slice(-5) || 'N/A'}</p>
        </div>
      </div>

      {/* POS Content */}
      <div className={`${!isInside || isSubmitting ? 'opacity-40 pointer-events-none grayscale' : ''} transition-all duration-700`}>
        <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200 border border-white">
          <h3 className="text-2xl font-black mb-6 flex items-center gap-3 text-slate-900">
            <div className="bg-blue-100 p-2 rounded-xl"><Scan className="text-blue-600" size={24} /></div>
            CHECKOUT
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-5 bg-slate-50 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-2xl shadow-sm"><PackageOpen className="text-slate-400" size={20} /></div>
                <div>
                  <p className="font-black text-slate-800">Nexus Premium Unit</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Inventory Spoke: 14 units</p>
                </div>
              </div>
              <p className="font-black text-blue-600">GHS 450</p>
            </div>

            <button
              onClick={handleCompleteSale}
              disabled={isSubmitting}
              className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-lg flex items-center justify-center gap-3 hover:bg-black active:scale-[0.97] transition-all shadow-2xl shadow-slate-300"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : <><ShoppingCart size={22} /> COMPLETE SALE</>}
            </button>
          </div>
        </div>

        {!isInside && (
          <div className="mt-8 text-center p-8 bg-white rounded-[2.5rem] border-2 border-dashed border-rose-200">
            <div className="bg-rose-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="text-rose-600" />
            </div>
            <p className="text-rose-600 font-black text-lg uppercase tracking-tight">Geofence Violation</p>
            <p className="text-sm text-slate-500 font-medium px-4 mt-1">Terminal locked. You must be within the assigned physical shop location to process transactions.</p>
          </div>
        )}
      </div>

      {/* Modern Mobile Bottom Nav */}
      <nav className="fixed bottom-6 left-6 right-6 bg-slate-900/90 backdrop-blur-xl border border-white/10 p-4 rounded-[2rem] flex justify-around shadow-2xl shadow-black/20">
        <button className="flex flex-col items-center gap-1 text-blue-400">
          <ShoppingCart size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">POS</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-500">
          <MapPin size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">Map</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-500">
          <ShieldCheck size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">Log</span>
        </button>
      </nav>
    </div>
  );
}