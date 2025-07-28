/**
 * Service Worker for Carelwave Media PWA
 * Handles offline functionality, caching, push notifications, and background sync
 * @version 1.0.0
 * @author Carelwave Media Development Team
 * @created 2025-01-15
 */

// Service Worker configuration
const CACHE_NAME = 'carelwave-media-v1.0.0';
const DATA_CACHE_NAME = 'carelwave-data-v1.0.0';
const RUNTIME_CACHE_NAME = 'carelwave-runtime-v1.0.0';

// Cache configuration
const CACHE_CONFIG = {
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  maxEntries: 1000,
  networkTimeoutSeconds: 3,
  staleWhileRevalidate: true
};

// Static assets to cache on install
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^https:\/\/api\.carelwavemedia\.com\/posts/,
  /^https:\/\/api\.carelwavemedia\.com\/analytics/,
  /^https:\/\/api\.carelwavemedia\.com\/newsletter/
];

// Network-first patterns (always try network first)
const NETWORK_FIRST_PATTERNS = [
  /^https:\/\/api\.carelwavemedia\.com\/admin/,
  /^https:\/\/api\.carelwavemedia\.com\/auth/,
  /^https:\/\/api\.carelwavemedia\.com\/upload/
];

// Cache-first patterns (static assets)
const CACHE_FIRST_PATTERNS = [
  /\.(?:png|gif|jpg|jpeg|svg|webp|ico|woff|woff2|ttf|eot)$/,
  /\.(?:css|js)$/,
  /^https:\/\/fonts\.googleapis\.com/,
  /^https:\/\/fonts\.gstatic\.com/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== DATA_CACHE_NAME && 
                cacheName !== RUNTIME_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all pages
      self.clients.claim()
    ])
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    // Handle POST/PUT requests for background sync
    if (request.url.includes('/api/')) {
      event.respondWith(handleApiRequest(request));
    }
    return;
  }
  
  // Handle different types of requests
  if (url.origin === self.location.origin) {
    // Same-origin requests
    if (request.url.includes('/api/')) {
      event.respondWith(handleApiRequest(request));
    } else {
      event.respondWith(handleNavigationRequest(request));
    }
  } else {
    // Cross-origin requests (fonts, CDN assets, etc.)
    event.respondWith(handleCrossOriginRequest(request));
  }
});

// Handle API requests with appropriate caching strategy
async function handleApiRequest(request) {
  const url = request.url;
  
  try {
    // Network-first for admin and auth endpoints
    if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url))) {
      return await networkFirst(request, DATA_CACHE_NAME);
    }
    
    // Cache-first for cacheable API endpoints
    if (API_CACHE_PATTERNS.some(pattern => pattern.test(url))) {
      return await cacheFirst(request, DATA_CACHE_NAME);
    }
    
    // Default: network-only for other API requests
    return await fetch(request);
    
  } catch (error) {
    console.error('[SW] API request failed:', error);
    
    // Return cached response if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API failures
    return new Response(
      JSON.stringify({ 
        error: 'Network unavailable', 
        offline: true,
        message: 'This request failed because you are offline. It will be retried when you are back online.'
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle navigation requests (HTML pages)
async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    const offlineResponse = await caches.match('/offline.html');
    return offlineResponse || new Response('Offline', { status: 503 });
  }
}

// Handle cross-origin requests (CDN assets, fonts, etc.)
async function handleCrossOriginRequest(request) {
  // Cache-first for static assets
  if (CACHE_FIRST_PATTERNS.some(pattern => pattern.test(request.url))) {
    return await cacheFirst(request, CACHE_NAME);
  }
  
  // Network-only for other cross-origin requests
  return fetch(request);
}

// Cache-first strategy
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Return cached response and update in background if stale
    if (CACHE_CONFIG.staleWhileRevalidate) {
      updateCacheInBackground(request, cacheName);
    }
    return cachedResponse;
  }
  
  // Not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache-first failed:', error);
    throw error;
  }
}

// Network-first strategy
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetchWithTimeout(request, CACHE_CONFIG.networkTimeoutSeconds * 1000);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('[SW] Network failed, trying cache for:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Fetch with timeout
function fetchWithTimeout(request, timeout) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Network timeout'));
    }, timeout);
    
    fetch(request).then(
      (response) => {
        clearTimeout(timeoutId);
        resolve(response);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}

// Update cache in background
function updateCacheInBackground(request, cacheName) {
  fetch(request).then((response) => {
    if (response && response.status === 200) {
      caches.open(cacheName).then((cache) => {
        cache.put(request, response);
      });
    }
  }).catch(() => {
    // Ignore background update failures
  });
}

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

// Periodic sync event (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync event:', event.tag);
  
  if (event.tag === 'periodic-sync') {
    event.waitUntil(performPeriodicSync());
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');
  
  let notificationData = {
    title: 'Carelwave Media',
    body: 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'default',
    requireInteraction: false
  };
  
  if (event.data) {
    try {
      notificationData = { ...notificationData, ...event.data.json() };
    } catch (error) {
      console.error('[SW] Error parsing push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/icons/action-view.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/action-dismiss.png'
        }
      ],
      data: notificationData.data || {}
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click event');
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  
  if (action === 'view' || !action) {
    // Open the app
    event.waitUntil(
      clients.openWindow(data.url || '/')
    );
  }
  // 'dismiss' action just closes the notification (already done above)
});

// Sync offline data
async function syncOfflineData() {
  try {
    console.log('[SW] Syncing offline data');
    
    // Get all offline data from IndexedDB or local storage
    const offlineData = await getOfflineData();
    
    for (const item of offlineData) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
        
        // Remove synced item from offline storage
        await removeOfflineData(item.id);
        
      } catch (error) {
        console.error('[SW] Failed to sync item:', item.id, error);
      }
    }
    
    console.log('[SW] Offline data sync completed');
    
  } catch (error) {
    console.error('[SW] Offline data sync failed:', error);
  }
}

// Perform periodic sync
async function performPeriodicSync() {
  try {
    console.log('[SW] Performing periodic sync');
    
    // Update cache with fresh data
    const criticalUrls = [
      '/api/posts/recent',
      '/api/analytics/summary',
      '/api/newsletter/stats'
    ];
    
    for (const url of criticalUrls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const cache = await caches.open(DATA_CACHE_NAME);
          cache.put(url, response.clone());
        }
      } catch (error) {
        console.error('[SW] Failed to sync URL:', url, error);
      }
    }
    
    // Clean up old cache entries
    await cleanupOldCacheEntries();
    
    console.log('[SW] Periodic sync completed');
    
  } catch (error) {
    console.error('[SW] Periodic sync failed:', error);
  }
}

// Get offline data (placeholder - would use IndexedDB in real implementation)
async function getOfflineData() {
  // In a real implementation, this would read from IndexedDB
  return [];
}

// Remove offline data (placeholder)
async function removeOfflineData(id) {
  // In a real implementation, this would remove from IndexedDB
  console.log('[SW] Removing offline data:', id);
}

// Clean up old cache entries
async function cleanupOldCacheEntries() {
  const cacheNames = [DATA_CACHE_NAME, RUNTIME_CACHE_NAME];
  
  for (const cacheName of cacheNames) {
    try {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      // Remove entries older than maxAge
      const now = Date.now();
      const maxAge = CACHE_CONFIG.maxAge;
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const dateHeader = response.headers.get('date');
          if (dateHeader) {
            const cacheDate = new Date(dateHeader).getTime();
            if (now - cacheDate > maxAge) {
              await cache.delete(request);
              console.log('[SW] Removed old cache entry:', request.url);
            }
          }
        }
      }
      
      // Limit cache size
      const remainingRequests = await cache.keys();
      if (remainingRequests.length > CACHE_CONFIG.maxEntries) {
        const excessCount = remainingRequests.length - CACHE_CONFIG.maxEntries;
        for (let i = 0; i < excessCount; i++) {
          await cache.delete(remainingRequests[i]);
        }
        console.log('[SW] Removed excess cache entries:', excessCount);
      }
      
    } catch (error) {
      console.error('[SW] Cache cleanup failed for:', cacheName, error);
    }
  }
}

// Message handling
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ success: true });
    }).catch((error) => {
      event.ports[0].postMessage({ success: false, error: error.message });
    });
  }
});

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
  console.log('[SW] All caches cleared');
}

// Error handling
self.addEventListener('error', (event) => {
  console.error('[SW] Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
});

console.log('[SW] Service Worker loaded successfully'); 