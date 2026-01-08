const CACHE_VERSION = 'v2.0.0';
const CACHE_NAME = `ultimate-sports-ai-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

// Core assets to cache on install
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/analytics.js',
  '/achievements.js',
  '/sounds.js',
  '/styles.css',
  '/motion-blur-animations.css',
  '/manifest.webmanifest',
  '/privacy-policy.html',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap'
];

// Extended assets to cache (non-critical)
const EXTENDED_ASSETS = [
  '/advanced-insights.js',
  '/parallax-effects.js',
  '/push-notifications.js',
  '/reward-animations.js',
  '/rewards-system.js',
  '/smart-notifications.js',
  '/backend-simulation.js',
  'https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg',
  'https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg',
  'https://cdn.nba.com/logos/nba/1610612751/primary/L/logo.svg',
  'https://cdn.nba.com/logos/nba/1610612738/primary/L/logo.svg'
];

// Install service worker and cache core assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        // Cache extended assets without blocking installation
        return caches.open(CACHE_NAME).then(cache => {
          return Promise.all(
            EXTENDED_ASSETS.map(url => {
              return cache.add(url).catch(err => {
                console.warn(`[Service Worker] Failed to cache: ${url}`, err);
              });
            })
          );
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate service worker and clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch strategy: Network First for API calls, Cache First for assets
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip cross-origin requests we don't want to cache
  if (url.origin !== location.origin && !url.href.includes('cdn.nba.com') && !url.href.includes('fonts.googleapis.com')) {
    return;
  }

  // Network First strategy for API calls and HTML
  if (request.method === 'GET' && (request.headers.get('accept')?.includes('text/html') || url.pathname.includes('/api/'))) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clone and cache the response
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Cache First strategy for assets (CSS, JS, images)
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Return cached version and update in background
          fetch(request).then(response => {
            if (response && response.status === 200) {
              caches.open(RUNTIME_CACHE).then(cache => {
                cache.put(request, response);
              });
            }
          }).catch(() => {});
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request).then(response => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clone and cache the response
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(request, responseToCache);
          });

          return response;
        });
      })
  );
});
// Handle incoming push notifications
self.addEventListener('push', event => {
    let data;
    try {
        data = event.data.json();
    } catch (e) {
        data = {
            title: 'Ultimate Sports AI',
            body: event.data.text(),
            icon: 'https://rosebud.ai/assets/Ultimate sports logo match app layout.png?lZrN'
        };
    }
    console.log('[Service Worker] Push notification received:', data);
    const title = data.title || 'Ultimate Sports AI';
    const options = {
        body: data.body || 'You have a new update.',
        icon: data.icon || 'https://rosebud.ai/assets/Ultimate sports logo match app layout.png?lZrN',
        badge: 'https://rosebud.ai/assets/Ultimate sports logo match app layout.png?lZrN',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/',
            timestamp: Date.now()
        },
        actions: [
            { action: 'explore', title: 'View Now', icon: 'https://rosebud.ai/assets/Ultimate sports logo match app layout.png?lZrN' },
            { action: 'dismiss', title: 'Dismiss' }
        ],
        tag: data.tag || 'default',
        requireInteraction: false,
        silent: false
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click
self.addEventListener('notificationclick', event => {
    console.log('[Service Worker] Notification clicked:', event.action);
    event.notification.close();
    
    if (event.action === 'dismiss') {
        return;
    }
    
    const urlToOpen = event.notification.data.url || '/';
    
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(clientList => {
            // Check if app is already open
            for (const client of clientList) {
                if (client.url.includes(urlToOpen.split('#')[0]) && 'focus' in client) {
                    return client.focus().then(client => {
                        // Send message to open specific section if hash exists
                        if (urlToOpen.includes('#')) {
                            client.postMessage({
                                type: 'NAVIGATE',
                                url: urlToOpen
                            });
                        }
                        return client;
                    });
                }
            }
            // Open new window if not already open
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Listen for messages from the client
self.addEventListener('message', event => {
    console.log('[Service Worker] Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'SEND_TEST_NOTIFICATION') {
        console.log('[Service Worker] Sending test notification...');
        
        const testPayload = {
            title: 'Test Notification! 🚀',
            body: 'Your notifications are working perfectly!',
            icon: 'https://rosebud.ai/assets/Ultimate sports logo match app layout.png?lZrN',
            url: '/#bet-history',
            tag: 'test'
        };
        
        event.waitUntil(
            self.registration.showNotification(testPayload.title, {
                body: testPayload.body,
                icon: testPayload.icon,
                badge: 'https://rosebud.ai/assets/Ultimate sports logo match app layout.png?lZrN',
                vibrate: [200, 100, 200],
                data: { url: testPayload.url },
                tag: testPayload.tag,
                actions: [
                    { action: 'explore', title: 'View Now' },
                    { action: 'dismiss', title: 'Dismiss' }
                ]
            })
        );
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_VERSION });
    }
});

// Handle background sync (for future use)
self.addEventListener('sync', event => {
    console.log('[Service Worker] Background sync:', event.tag);
    
    if (event.tag === 'sync-predictions') {
        event.waitUntil(syncPredictions());
    }
});

// Sync predictions in background
async function syncPredictions() {
    try {
        // This would sync any pending predictions
        console.log('[Service Worker] Syncing predictions...');
        // Implementation would go here
    } catch (error) {
        console.error('[Service Worker] Sync failed:', error);
    }
}

// Monitor for app updates
self.addEventListener('controllerchange', () => {
    console.log('[Service Worker] New service worker activated');
});