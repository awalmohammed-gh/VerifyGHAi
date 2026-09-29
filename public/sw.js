/**
 * VerifAI Ghana - Workbox Service Worker
 * Enables offline access to the dashboard, cached recent scans, verification history, and application assets.
 */

// Import official Google Workbox CDN runtime
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js');

if (workbox) {
  console.log('[VerifAI SW] Workbox loaded successfully');

  // Disable verbose debug in production
  workbox.setConfig({ debug: false });

  // Core activation control
  workbox.core.skipWaiting();
  workbox.core.clientsClaim();

  const CACHE_NAMES = {
    appShell: 'verifai-app-shell-v1',
    staticAssets: 'verifai-static-assets-v1',
    images: 'verifai-images-v1',
    googleFonts: 'verifai-google-fonts-v1',
    apiVerifications: 'verifai-api-verifications-v1',
    apiStats: 'verifai-api-stats-v1',
    apiNews: 'verifai-api-news-v1',
  };

  // 1. App Shell / Single Page App Navigation Route (Dashboard, History, Results, Settings)
  // Network-first strategy with cache fallback ensures users get the latest app shell when online,
  // but can smoothly access all dashboard routes when offline.
  const appShellStrategy = new workbox.strategies.NetworkFirst({
    cacheName: CACHE_NAMES.appShell,
    networkTimeoutSeconds: 3,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  });

  workbox.routing.registerRoute(
    new workbox.routing.NavigationRoute(appShellStrategy, {
      // Exclude API and admin auth callbacks if needed
      denylist: [/^\/api\//],
    })
  );

  // 2. Static Assets (JS, CSS, Web Workers)
  workbox.routing.registerRoute(
    ({ request }) =>
      request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'worker',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: CACHE_NAMES.staticAssets,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
      ],
    })
  );

  // 3. Web Fonts (Google Fonts & Typography)
  workbox.routing.registerRoute(
    ({ url }) =>
      url.origin === 'https://fonts.googleapis.com' ||
      url.origin === 'https://fonts.gstatic.com',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: CACHE_NAMES.googleFonts,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // 4. Images & Icons
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: CACHE_NAMES.images,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 150,
          maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // 5. Verification API & Recent Scans (GET /api/verifications, /api/verifications/recent, /api/verifications/:id)
  // Network-First with quick timeout so offline users instantly retrieve previously loaded scans and history
  workbox.routing.registerRoute(
    ({ url, request }) =>
      url.pathname.startsWith('/api/verifications') &&
      request.method === 'GET',
    new workbox.strategies.NetworkFirst({
      cacheName: CACHE_NAMES.apiVerifications,
      networkTimeoutSeconds: 2.5,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 120,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // 6. User Stats & Trends API (GET /api/users/stats, /api/users/dashboard-stats)
  workbox.routing.registerRoute(
    ({ url, request }) =>
      (url.pathname.startsWith('/api/users/stats') ||
        url.pathname.startsWith('/api/users/dashboard-stats') ||
        url.pathname.startsWith('/api/analytics')) &&
      request.method === 'GET',
    new workbox.strategies.NetworkFirst({
      cacheName: CACHE_NAMES.apiStats,
      networkTimeoutSeconds: 2.5,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 3 * 24 * 60 * 60, // 3 days
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // 7. News & Alerts Feed API (GET /api/news, /api/alerts)
  workbox.routing.registerRoute(
    ({ url, request }) =>
      (url.pathname.startsWith('/api/news') ||
        url.pathname.startsWith('/api/alerts')) &&
      request.method === 'GET',
    new workbox.strategies.NetworkFirst({
      cacheName: CACHE_NAMES.apiNews,
      networkTimeoutSeconds: 2.5,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 2 * 24 * 60 * 60, // 2 days
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // 8. Custom Global Catch Handler for Offline Fallbacks
  workbox.routing.setCatchHandler(async ({ event, request }) => {
    // If navigation fails (user is offline and requesting a new route)
    if (request.destination === 'document' || request.mode === 'navigate') {
      const cachedShell = await caches.match('/index.html');
      if (cachedShell) {
        return cachedShell;
      }
      const matchAny = await caches.match(request);
      if (matchAny) {
        return matchAny;
      }
    }

    // If an API request fails while offline, attempt to match cache or return clean fallback
    if (request.url.includes('/api/')) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      return new Response(
        JSON.stringify({
          success: true,
          offline: true,
          message: 'Offline mode active. Displaying locally persisted scans and records.',
          data: [],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return Response.error();
  });

  // Listen to message events from client
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });
} else {
  console.warn('[VerifAI SW] Workbox failed to initialize.');
}
