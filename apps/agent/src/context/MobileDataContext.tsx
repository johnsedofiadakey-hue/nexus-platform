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

// 🚀 OPTIMIZED: Tiered cache strategy
const CACHE_DURATION = {
  IDENTITY: 30 * 60 * 1000,    // 30 minutes (rarely changes)
  INVENTORY: 5 * 60 * 1000,    // 5 minutes (changes occasionally)
  GPS: 24 * 60 * 60 * 1000     // 24 hours (static)
};

// 🚀 OPTIMIZED: Smart sync intervals based on visibility
const SYNC_INTERVAL = {
  ACTIVE: 120 * 1000,       //  minutes when tab active  
  BACKGROUND: 600 * 1000   // 10 minutes when tab hidden
};

// Request deduplication cache
const activeRequests = new Map<string, Promise<any>>();

export function MobileDataProvider({ children }: { children: React.ReactNode }) {
  const [identity, setIdentity] = useState<MobileIdentity | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [currentShopId, setCurrentShopId] = useState<string | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const previousShopIdRef = useRef<string | null>(null);
  const identityRef = useRef<MobileIdentity | null>(null);
  const lastShopIdRef = useRef<string | null>(null);

  // Keep refs in sync with state and update currentShopId only when value changes
  useEffect(() => {
    identityRef.current = identity;
    const newShopId = identity?.shopId || null;
    
    // Only update currentShopId state if the actual value changed
    // Use ref to track last value to avoid circular dependency
    if (newShopId !== lastShopIdRef.current) {
      lastShopIdRef.current = newShopId;
      setCurrentShopId(newShopId);
    }
  }, [identity]); // Only depend on identity, not currentShopId

  // 📦 OPTIMIZED: Load from cache with tiered TTL
  const loadFromCache = useCallback(() => {
    try {
      const cachedIdentity = localStorage.getItem(CACHE_KEYS.IDENTITY);
      const cachedInventory = localStorage.getItem(CACHE_KEYS.INVENTORY);
      const cachedSync = localStorage.getItem(CACHE_KEYS.LAST_SYNC);

      if (cachedIdentity && cachedInventory && cachedSync) {
        const syncTime = new Date(cachedSync);
        const age = Date.now() - syncTime.getTime();

        // Use inventory cache duration (5 minutes)
        if (age < CACHE_DURATION.INVENTORY) {
          const parsedIdentity = JSON.parse(cachedIdentity);
          const parsedInventory = JSON.parse(cachedInventory);
          
          setIdentity(parsedIdentity);
          setInventory(parsedInventory);
          setLastSync(syncTime);
          
          console.log(`✅ Cache loaded (age: ${Math.round(age/1000)}s)`);
          return true;
        } else {
          console.log(`⏰ Cache expired (age: ${Math.round(age/1000)}s, max: ${CACHE_DURATION.INVENTORY/1000}s)`);
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

  // 🔄 OPTIMIZED: Refresh inventory with request deduplication
  const refreshInventory = useCallback(async () => {
    const currentIdentity = identityRef.current;
    if (!currentIdentity?.shopId) return;

    const cacheKey = `inventory-${currentIdentity.shopId}`;
    
    // Check if request already in flight
    if (activeRequests.has(cacheKey)) {
      console.log('⏩ Deduplicating inventory request');
      return activeRequests.get(cacheKey);
    }

    try {
      const requestPromise = fetch(`/api/inventory?shopId=${currentIdentity.shopId}&t=${Date.now()}`)
        .then(res => {
          if (res.ok) {
            return res.json();
          }
          throw new Error(`HTTP ${res.status}`);
        })
        .then(data => {
          const items = Array.isArray(data) ? data : (data.data || []);
          setInventory(items);
          
          // Update cache
          if (identityRef.current) {
            saveToCache(identityRef.current, items);
          }
          return items;
        })
        .finally(() => {
          activeRequests.delete(cacheKey);
        });
      
      activeRequests.set(cacheKey, requestPromise);
      await requestPromise;
    } catch (e: any) {
      console.warn('⚠️ Background inventory sync failed:', e.message);
      // Don't set error state for background sync failures
    }
  }, [saveToCache]);

  // 🔄 FULL DATA REFRESH WITH REQUEST DEDUPLICATION
  const refreshData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setError(null);

    const cacheKey = 'mobile-init';
    
    // Check if request already in flight
    if (activeRequests.has(cacheKey)) {
      console.log('⏩ Deduplicating init request');
      return activeRequests.get(cacheKey);
    }

    try {
      // Parallel fetch for speed
      console.log('📡 Mobile Init: Fetching assignment data...');
      
      const requestPromise = (async () => {
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
      })().finally(() => {
        activeRequests.delete(cacheKey);
        setLoading(false);
      });

      activeRequests.set(cacheKey, requestPromise);
      await requestPromise;

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
      setLoading(false);
    }
  }, [saveToCache]);

  // 🎯 OPTIMISTIC UPDATE
  const updateInventoryItem = useCallback((id: string, updates: Partial<InventoryItem>) => {
    setInventory(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  // 🚀 INITIAL LOAD WITH VISIBILITY-BASED SYNC
  useEffect(() => {
    let isMounted = true;
    
    // Try cache first for instant load
    const hasCachedData = loadFromCache();
    
    if (hasCachedData) {
      setLoading(false);
      // Still refresh in background
      if (isMounted) {
        refreshData(false);
      }
    } else {
      if (isMounted) {
        refreshData(true);
      }
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // 🎯 SEPARATE EFFECT: Smart sync based on page visibility
  useEffect(() => {
    if (!currentShopId) return; // Wait for shopId to be loaded

    let currentInterval = SYNC_INTERVAL.ACTIVE;
    let syncIntervalId: NodeJS.Timeout;

    const startSync = () => {
      if (syncIntervalId) clearInterval(syncIntervalId);
      syncIntervalId = setInterval(() => {
        if (identityRef.current?.shopId === currentShopId) {
          refreshInventory();
        }
      }, currentInterval);
    };

    // Handle visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden - slow down sync
        console.log('📴 Tab hidden - reducing sync frequency');
        currentInterval = SYNC_INTERVAL.BACKGROUND;
      } else {
        // Tab visible - speed up sync
        console.log('📱 Tab active - increasing sync frequency');
        currentInterval = SYNC_INTERVAL.ACTIVE;
        // Immediate sync on resume
        if (identityRef.current?.shopId === currentShopId) {
          refreshInventory();
        }
      }
      startSync();
    };

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Start initial sync after a short delay to avoid immediate re-fetch
    const timeoutId = setTimeout(() => {
      startSync();
    }, 5000); // Wait 5 seconds before starting periodic sync

    return () => {
      clearTimeout(timeoutId);
      if (syncIntervalId) {
        clearInterval(syncIntervalId);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentShopId]); // Only re-run when the shopId string value actually changes

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
