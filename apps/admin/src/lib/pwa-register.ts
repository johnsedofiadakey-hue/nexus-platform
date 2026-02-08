// Register Service Worker for PWA functionality
export function registerServiceWorker() {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration.scope);

        // Check for updates every 60 seconds
        setInterval(() => {
          registration.update();
        }, 60000);
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}

// Request persistent storage for offline data
export async function requestPersistentStorage() {
  if (typeof window === 'undefined') return false;
  if (!navigator.storage || !navigator.storage.persist) return false;

  const isPersisted = await navigator.storage.persist();
  console.log(`💾 Persistent storage: ${isPersisted ? 'granted' : 'denied'}`);
  return isPersisted;
}

// Check if running as installed PWA
export function isInstalledPWA(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}
