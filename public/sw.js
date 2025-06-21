const CACHE_NAME = 'aqua-water-v2';
const STATIC_CACHE = 'aqua-static-v2';
const DYNAMIC_CACHE = 'aqua-dynamic-v2';

// Cache essential static assets
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/pwa-64x64.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/signin',
  '/dashboard',
  '/offline.html'
];

// Cache API routes for offline functionality
const API_ROUTES = [
  '/api/dashboard/stats',
  '/api/dashboard/overview',
  '/api/customers',
  '/api/products',
  '/api/services'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, {cache: 'reload'})));
      }),
      caches.open(DYNAMIC_CACHE).then(cache => {
        console.log('[SW] Dynamic cache ready');
        return Promise.resolve();
      })
    ])
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) return;

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match('/') || 
                 caches.match('/signin') ||
                 new Response('Offline - Please check your connection', {
                   status: 503,
                   headers: { 'Content-Type': 'text/plain' }
                 });
        })
    );
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful API responses
          if (response.ok && request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Serve from cache if available
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline response for failed API calls
            return new Response(JSON.stringify({
              error: 'Offline - Data not available',
              offline: true
            }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then(response => {
        // Cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          const cacheToUse = STATIC_ASSETS.includes(url.pathname) ? STATIC_CACHE : DYNAMIC_CACHE;
          caches.open(cacheToUse).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New notification from Project Aqua',
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: [
        {
          action: 'open',
          title: 'Open App',
          icon: '/pwa-64x64.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/pwa-64x64.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Project Aqua', options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received');
  
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// Background sync function
async function doBackgroundSync() {
  try {
    // Sync any pending data when back online
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();
    
    // Re-fetch critical data to update cache
    const criticalEndpoints = [
      '/api/dashboard/stats',
      '/api/dashboard/overview'
    ];
    
    for (const endpoint of criticalEndpoints) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          await cache.put(endpoint, response.clone());
        }
      } catch (error) {
        console.log('[SW] Failed to sync:', endpoint);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
} 