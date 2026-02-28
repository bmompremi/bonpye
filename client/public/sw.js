const CACHE_NAME = 'bonpye-v1';
const RUNTIME_CACHE = 'bonpye-runtime-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  // Never intercept auth routes — OAuth redirects must go directly to the server
  if (url.pathname.startsWith('/api/auth/')) {
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Offline - API not available' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((response) => {
          return response || new Response('Offline - Page not cached', { status: 503 });
        });
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('Push notification received with no data');
    return;
  }

  try {
    const data = event.data.json();
    const { title, body, icon, badge, tag, data: notificationData } = data;

    const options = {
      body: body || 'New message from BONPYE',
      icon: icon || '/favicon.ico',
      badge: badge || '/favicon.ico',
      tag: tag || 'bonpye-notification',
      data: notificationData || {},
      requireInteraction: false,
    };

    event.waitUntil(
      self.registration.showNotification(title || 'BONPYE', options)
    );
  } catch (error) {
    console.error('Error handling push notification:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/messages';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
});
