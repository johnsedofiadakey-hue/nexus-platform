"use client";

/**
 * 🚀 MOBILE DATA CONTEXT - HIGH PERFORMANCE
 * Centralized state management for mobile POS
 * Features:
 * - Smart caching with localStorage
 * - Background sync
 * - Optimistic updates
 * - Auto-refresh on shop reassignment
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";

interface MobileIdentity {
  id: string;
  agentName: string;
  agentImage?: string;
  shopId: string;
  shopName: string;
  managerName?: string;
  managerPhone?: string;
  // GPS Coordinates for geofencing
  shopLat?: number;
  shopLng?: number;
  radius?: number;
  targetProgress?: {
    targetValue: number;
    targetQuantity: number;
    achievedValue: number;
    achievedQuantity: number;
  } | null;
  bypassGeofence?: boolean;
  lockout?: { active: boolean; returnDate?: string };
}

interface InventoryItem {
  id: string;
  productName: string;
  sku?: string;
  quantity: number;
  priceGHS: number;
  stockLevel: number;
  category?: string;
}

interface MobileDataContextType {
  identity: MobileIdentity | null;
  inventory: InventoryItem[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  refreshInventory: () => Promise<void>;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  lastSync: Date | null;
}

const MobileDataContext = createContext<MobileDataContextType | undefined>(undefined);

const CACHE_KEYS = {
  IDENTITY: 'nexus_mobile_identity',
  INVENTORY: 'nexus_mobile_inventory',
  LAST_SYNC: 'nexus_mobile_last_sync'
};

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
const SYNC_INTERVAL = 30 * 1000; // 30 seconds background sync

export function MobileDataProvider({ children }: { children: React.ReactNode }) {
  const [identity, setIdentity] = useState<MobileIdentity | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const previousShopIdRef = useRef<string | null>(null);

  // 📦 LOAD FROM CACHE
  const loadFromCache = useCallback(() => {
    try {
      const cachedIdentity = localStorage.getItem(CACHE_KEYS.IDENTITY);
      const cachedInventory = localStorage.getItem(CACHE_KEYS.INVENTORY);
      const cachedSync = localStorage.getItem(CACHE_KEYS.LAST_SYNC);

      if (cachedIdentity && cachedInventory && cachedSync) {
        const syncTime = new Date(cachedSync);
        const age = Date.now() - syncTime.getTime();

        if (age < CACHE_DURATION) {
          setIdentity(JSON.parse(cachedIdentity));
          setInventory(JSON.parse(cachedInventory));
          setLastSync(syncTime);
          return true;
        }
      }
    } catch (e) {
      console.error('Cache load failed:', e);
    }
    return false;
  }, []);

  // 💾 SAVE TO CACHE
  const saveToCache = useCallback((identityData: MobileIdentity, inventoryData: InventoryItem[]) => {
    try {
      const now = new Date();
      localStorage.setItem(CACHE_KEYS.IDENTITY, JSON.stringify(identityData));
      localStorage.setItem(CACHE_KEYS.INVENTORY, JSON.stringify(inventoryData));
      localStorage.setItem(CACHE_KEYS.LAST_SYNC, now.toISOString());
      setLastSync(now);
    } catch (e) {
      console.error('Cache save failed:', e);
    }
  }, []);

  // 🔄 REFRESH INVENTORY ONLY (Fast)
  const refreshInventory = useCallback(async () => {
    if (!identity?.shopId) return;

    try {
      const res = await fetch(`/api/inventory?shopId=${identity.shopId}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.data || []);
        
        setInventory(items);
        
        // Update cache
        if (identity) {
          saveToCache(identity, items);
        }
      } else {
        console.warn('Background inventory sync failed:', res.status);
      }
    } catch (e) {
      console.error('Inventory sync failed:', e);
      // Don't set error state for background sync failures
    }
  }, [identity, saveToCache]);

  // 🔄 FULL DATA REFRESH
  const refreshData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setError(null);

    try {
      // Parallel fetch for speed
      console.log('📡 Mobile Init: Fetching assignment data...');
      const initRes = await fetch(`/api/mobile/init?t=${Date.now()}`, { credentials: 'include' });
      
      if (!initRes.ok) {
        if (initRes.status === 401) {
          console.error('❌ Mobile Init: Authentication failed');
          throw new Error('AUTH_FAILED');
        }
        if (initRes.status === 409) {
          // User is not assigned to a shop
          console.error('❌ Mobile Init: No shop assignment');
          setError('NO_SHOP_ASSIGNED');
          toast.error('No shop assigned. Contact your manager.', { duration: 5000 });
          setLoading(false);
          return;
        }
        console.error(`❌ Mobile Init: Failed with status ${initRes.status}`);
        throw new Error('Init failed');
      }

      const initData = await initRes.json();
      console.log('✅ Mobile Init: Assignment data received', {
        shopId: initData.shopId,
        shopName: initData.shopName,
        hasGPS: !!(initData.shopLat && initData.shopLng)
      });

      if (!initData.shopId) {
        console.error('❌ Mobile Init: Response missing shopId');
        setError('NO_SHOP_ASSIGNED');
        toast.error('Invalid shop assignment. Please contact support.', { duration: 5000 });
        setLoading(false);
        return;
      }

      const identityData: MobileIdentity = {
        id: initData.id,
        agentName: initData.agentName,
        agentImage: initData.agentImage,
        shopId: initData.shopId,
        shopName: initData.shopName,
        managerName: initData.managerName,
        managerPhone: initData.managerPhone,
        // GPS data for geofencing
        shopLat: initData.shopLat,
        shopLng: initData.shopLng,
        radius: initData.radius || 100,
        targetProgress: initData.targetProgress,
        bypassGeofence: initData.bypassGeofence,
        lockout: initData.lockout
      };

      // Check if shop changed (reassignment)
      if (previousShopIdRef.current && previousShopIdRef.current !== initData.shopId) {
        console.log(`🔄 Shop Reassignment Detected: ${previousShopIdRef.current} → ${initData.shopId}`);
        toast.success(`🔄 Reassigned to ${initData.shopName}`, { duration: 3000 });
        // Clear old inventory immediately
        setInventory([]);
      }
      previousShopIdRef.current = initData.shopId;

      setIdentity(identityData);

      // Fetch inventory
      console.log(`📦 Fetching inventory for shop: ${initData.shopId}`);
      const invRes = await fetch(`/api/inventory?shopId=${initData.shopId}&t=${Date.now()}`);
      
      if (invRes.ok) {
        const invData = await invRes.json();
        const items = Array.isArray(invData) ? invData : (invData.data || []);
        
        console.log(`✅ Inventory loaded: ${items.length} items`);
        setInventory(items);
        saveToCache(identityData, items);
      } else {
        console.warn('⚠️ Inventory fetch failed:', invRes.status);
        // Set inventory to empty array but don't fail the whole sync
        setInventory([]);
        saveToCache(identityData, []);
      }

    } catch (e: any) {
      console.error('❌ Mobile Data Sync Error:', e);
      
      // Better error messaging
      let errorMessage = 'Connection error';
      if (e.message === 'AUTH_FAILED') {
        errorMessage = 'AUTH_FAILED';
        toast.error('Session expired. Please login again.', { duration: 5000 });
      } else if (e.message?.includes('fetch') || e.message?.includes('Failed to fetch')) {
        errorMessage = 'Network connection lost. Please check your internet.';
        toast.error('Network error. Retrying...', { duration: 3000 });
      } else if (e.message?.includes('timeout')) {
        errorMessage = 'Request timeout. Slow connection detected.';
        toast.error('Connection timeout. Please try again.', { duration: 3000 });
      } else {
        toast.error('Sync failed. Pull to refresh.', { duration: 3000 });
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [saveToCache]);

  // 🎯 OPTIMISTIC UPDATE
  const updateInventoryItem = useCallback((id: string, updates: Partial<InventoryItem>) => {
    setInventory(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  // 🚀 INITIAL LOAD
  useEffect(() => {
    // Try cache first for instant load
    const hasCachedData = loadFromCache();
    
    if (hasCachedData) {
      setLoading(false);
      // Still refresh in background
      refreshData(false);
    } else {
      refreshData(true);
    }

    // Setup background sync
    syncIntervalRef.current = setInterval(() => {
      refreshInventory();
    }, SYNC_INTERVAL);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [loadFromCache, refreshData, refreshInventory]);

  const value: MobileDataContextType = {
    identity,
    inventory,
    loading,
    error,
    refreshData,
    refreshInventory,
    updateInventoryItem,
    lastSync
  };

  return (
    <MobileDataContext.Provider value={value}>
      {children}
    </MobileDataContext.Provider>
  );
}

export function useMobileData() {
  const context = useContext(MobileDataContext);
  if (context === undefined) {
    throw new Error('useMobileData must be used within MobileDataProvider');
  }
  return context;
}
