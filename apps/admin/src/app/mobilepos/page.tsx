"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Store,
  TrendingUp,
  Package,
  DollarSign,
  Target,
  Clock,
  Phone,
  Shield,
  ChevronRight,
  Zap
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMobileData } from "@/context/MobileDataContext";
import SmartAttendance from "@/components/auth/SmartAttendance";

export default function MobileDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { identity, inventory, loading } = useMobileData();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (!mounted || status === "loading" || loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="p-6 text-center">
        <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">No Shop Assignment</h2>
        <p className="text-gray-600">Contact your manager to get assigned to a shop.</p>
      </div>
    );
  }

  const inventoryItems = Array.isArray(inventory) ? inventory : [];
  const lowStockCount = inventoryItems.filter(item => item.stockLevel < 10).length;
  const totalProducts = inventoryItems.length;

  return (
    <div className="min-h-full px-4 pt-6 pb-32 space-y-4">
      {/* HEADER - AGENT INFO */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-blue-100 text-sm mb-1">Welcome back,</p>
            <h1 className="text-2xl font-bold mb-1">{identity.agentName}</h1>
            <div className="flex items-center gap-2 text-blue-100 text-sm">
              <Store size={16} />
              <span>{identity.shopName}</span>
            </div>
          </div>
          
          {identity.bypassGeofence && (
            <div className="bg-yellow-500/20 px-3 py-1 rounded-full flex items-center gap-1">
              <Shield size={14} />
              <span className="text-xs font-medium">Admin</span>
            </div>
          )}
        </div>

        {/* GPS STATUS INDICATOR */}
        <div className="mt-4 pt-4 border-t border-blue-500/30">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-blue-200" />
              <span className="text-blue-100">
                {identity.shopLat && identity.shopLng 
                  ? `GPS: ${identity.shopLat.toFixed(4)}, ${identity.shopLng.toFixed(4)}`
                  : "GPS not configured"
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SMART ATTENDANCE */}
      {identity.shopLat && identity.shopLng && (
        <SmartAttendance 
          shopLat={identity.shopLat} 
          shopLng={identity.shopLng} 
          radius={identity.radius || 100}
          bypassGeofence={identity.bypassGeofence}
        />
      )}

      {/* QUICK STATS */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <Package size={20} className="text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
          <p className="text-xs text-gray-600">Total Products</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <Zap size={20} className="text-orange-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{lowStockCount}</p>
          <p className="text-xs text-gray-600">Low Stock Items</p>
        </div>
      </div>

      {/* TARGET PROGRESS */}
      {identity.targetProgress && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Target size={18} className="text-green-600" />
              Sales Target
            </h3>
            <span className="text-xs text-gray-500">This Period</span>
          </div>
          
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Value</span>
                <span className="font-medium">
                  GHS {identity.targetProgress.achievedValue.toFixed(2)} / {identity.targetProgress.targetValue.toFixed(2)}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${Math.min((identity.targetProgress.achievedValue / identity.targetProgress.targetValue) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Quantity</span>
                <span className="font-medium">
                  {identity.targetProgress.achievedQuantity} / {identity.targetProgress.targetQuantity} units
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${Math.min((identity.targetProgress.achievedQuantity / identity.targetProgress.targetQuantity) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANAGER CONTACT */}
      {identity.managerName && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Phone size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{identity.managerName}</p>
                <p className="text-xs text-gray-500">Your Manager</p>
              </div>
            </div>
            {identity.managerPhone && (
              <a 
                href={`tel:${identity.managerPhone}`}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                Call
              </a>
            )}
          </div>
        </div>
      )}

      {/* QUICK ACTIONS */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 px-1">Quick Actions</h3>
        
        <button
          onClick={() => router.push('/mobilepos/pos')}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-4 flex items-center justify-between hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
        >
          <div className="flex items-center gap-3">
            <DollarSign size={24} />
            <div className="text-left">
              <p className="font-semibold">Make a Sale</p>
              <p className="text-xs text-blue-100">Open POS Terminal</p>
            </div>
          </div>
          <ChevronRight size={20} />
        </button>

        <button
          onClick={() => router.push('/mobilepos/inventory')}
          className="w-full bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-all"
        >
          <div className="flex items-center gap-3">
            <Package size={24} className="text-gray-700" />
            <div className="text-left">
              <p className="font-semibold text-gray-900">View Inventory</p>
              <p className="text-xs text-gray-500">Check stock levels</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </button>

        <button
          onClick={() => router.push('/mobilepos/report')}
          className="w-full bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-all"
        >
          <div className="flex items-center gap-3">
            <TrendingUp size={24} className="text-gray-700" />
            <div className="text-left">
              <p className="font-semibold text-gray-900">Daily Report</p>
              <p className="text-xs text-gray-500">Submit end of day</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </button>
      </div>

      {/* GPS DISCLAIMER FOR ADMINS */}
      {identity.bypassGeofence && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex gap-3">
            <Shield size={20} className="text-yellow-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-900 mb-1">Admin Mode Active</p>
              <p className="text-xs text-yellow-700">
                GPS restrictions are bypassed. You can make sales from any location.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
