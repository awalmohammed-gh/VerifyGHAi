import { Workbox } from 'workbox-window';

export interface ServiceWorkerStatus {
  isRegistered: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  isCached: boolean;
  registration: ServiceWorkerRegistration | null;
}

type StatusCallback = (status: ServiceWorkerStatus) => void;

class ServiceWorkerManager {
  private wb: Workbox | null = null;
  private listeners: Set<StatusCallback> = new Set();
  private status: ServiceWorkerStatus = {
    isRegistered: false,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isUpdateAvailable: false,
    isCached: false,
    registration: null,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnlineStatusChange);
      window.addEventListener('offline', this.handleOnlineStatusChange);
    }
  }

  public getStatus(): ServiceWorkerStatus {
    return { ...this.status };
  }

  public subscribe(callback: StatusCallback): () => void {
    this.listeners.add(callback);
    callback(this.getStatus());
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    const current = this.getStatus();
    this.listeners.forEach((listener) => {
      try {
        listener(current);
      } catch (err) {
        console.error('[SW Manager] Listener notification error:', err);
      }
    });
  }

  private handleOnlineStatusChange = () => {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.status.isOnline = isOnline;
    console.log(`[VerifAI Network] Network state changed: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
    this.notify();

    // If we just transitioned to online, sync background cache
    if (isOnline) {
      this.warmCache();
    }
  };

  public register(): void {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('[VerifAI SW] Service Worker is not supported in this browser environment.');
      return;
    }

    try {
      this.wb = new Workbox('/sw.js');

      this.wb.addEventListener('installed', (event) => {
        if (event.isUpdate) {
          console.log('[VerifAI SW] New version of VerifAI GH is installed and ready.');
          this.status.isUpdateAvailable = true;
          this.notify();
        } else {
          console.log('[VerifAI SW] App shell and assets cached for offline use.');
          this.status.isCached = true;
          this.notify();
        }
      });

      this.wb.addEventListener('waiting', () => {
        console.log('[VerifAI SW] Service Worker waiting for activation.');
        this.status.isUpdateAvailable = true;
        this.notify();
      });

      this.wb.addEventListener('controlling', () => {
        console.log('[VerifAI SW] Service Worker is now controlling the page.');
        this.status.isRegistered = true;
        this.notify();
      });

      this.wb.addEventListener('activated', (event) => {
        if (!event.isUpdate) {
          console.log('[VerifAI SW] Offline service worker successfully activated.');
        }
        this.status.isRegistered = true;
        this.notify();
        this.warmCache();
      });

      this.wb
        .register()
        .then((registration) => {
          if (registration) {
            this.status.registration = registration;
            this.status.isRegistered = true;
            this.notify();
          }
        })
        .catch((error) => {
          console.warn('[VerifAI SW] Service worker registration notice:', error?.message || error);
        });
    } catch (err) {
      console.warn('[VerifAI SW] Failed to initialize Workbox:', err);
    }
  }

  /**
   * Prompts waiting Service Worker to skipWaiting and reload page
   */
  public updateAndReload(): void {
    if (this.wb) {
      this.wb.messageSkipWaiting();
      window.location.reload();
    }
  }

  /**
   * Pre-warms cache with essential API data when online
   */
  public async warmCache(): Promise<void> {
    if (typeof window === 'undefined' || !navigator.onLine || !('caches' in window)) return;

    try {
      // Warm up API routes for offline dashboard readiness
      const endpointsToPreCache = [
        '/api/verifications/recent',
        '/api/users/stats',
        '/api/users/dashboard-stats',
      ];

      const cache = await caches.open('verifai-api-verifications-v1');
      await Promise.allSettled(
        endpointsToPreCache.map(async (url) => {
          try {
            const token = localStorage.getItem('token');
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(url, { headers });
            if (response.ok) {
              await cache.put(url, response.clone());
            }
          } catch (e) {
            // Ignore pre-warming network hiccups
          }
        })
      );
    } catch (err) {
      // Ignore background warming errors
    }
  }
}

export const swManager = new ServiceWorkerManager();
