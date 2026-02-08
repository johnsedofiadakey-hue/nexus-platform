// 🚀 NEXUS MOBILE POS - SERVICE WORKER
// Aggressive caching for instant loading

const CACHE_NAME = 'nexus-pos-v1';
const RUNTIME_CACHE = 'nexus-runtime-v1';

// Critical files to cache immediately for offline use
const PRECACHE_URLS = [
  '/mobilepos/pos',
  '/mobilepos/inventory',
  '/mobilepos/history',
  '/mobilepos/sales',
  '/mobilepos/messages',
  '/mobilepos/profile',
  '/manifest.json',
];

// Install: Pre-cache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Cache-first strategy for static assets, network-first for API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // API requests: Network-first (with fast fallback)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request, { timeout: 3000 })
        .then(response => {
          // Clone and cache successful API responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets: Cache-first (instant loading)
  if (
    url.pathname.includes('/_next/') ||
    url.pathname.includes('/static/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2)$/)
  ) {
    event.respondWith(
      caches.match(request)
        .then(cached => {
          if (cached) return cached;
          return fetch(request).then(response => {
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(request, response.clone());
              return response;
            });
          });
        })
    );
    return;
  }

  // Pages: Network-first with cache fallback
  event.respondWith(
    fetch(request, { timeout: 2000 })
      .then(response => {
        const responseClone = response.clone();
        caches.open(RUNTIME_CACHE).then(cache => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Background sync for offline sales (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-sales') {
    event.waitUntil(syncSalesData());
  }
});

async function syncSalesData() {
  // TODO: Sync offline sales when back online
  console.log('🔄 Syncing offline sales...');
}
