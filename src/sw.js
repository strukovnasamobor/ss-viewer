import { precacheAndRoute } from 'workbox-precaching'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Required for injectManifest
precacheAndRoute(self.__WB_MANIFEST)

// Notification push
self.addEventListener('push', e => {
    const payload = e.data ? e.data.text() : 'error';
    console.log('[SW] Received background message:', payload);

    const title = "SS Viewer";
    let body = '';

    if (payload === 'teachers') {
        body = 'Promjene u rasporedu nastavnika.';
    } else if (payload === 'classes') {
        body = 'Promjene u rasporedu razreda.';
    } else if (payload === 'classrooms') {
        body = 'Promjene u rasporedu učionice.';
    } else {
        return;
    }

    e.waitUntil(
        self.registration.showNotification(title, {
          body: body,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          data: { entity: payload },
        })
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const data = event.notification.data || {};
    const targetUrl = self.location.origin + '/' + data.entity;

    event.waitUntil(
        clients.matchAll({ 
            type: 'window', 
            includeUncontrolled: false  // Only get controlled clients
        }).then(clientList => {
            console.log("Found controlled clients:", clientList.length);
            
            if (clientList.length > 0) {
                // Use the first controlled client
                const client = clientList[0];
                console.log("Using existing client:", client.url);
                
                // Focus the window
                if ('focus' in client) {
                    client.focus();
                }
                
                // Try to navigate
                if ('navigate' in client) {
                    console.log("Navigating existing client to:", targetUrl);
                    return client.navigate(targetUrl).catch(err => {
                        console.log("Navigate failed, using postMessage:", err);
                        client.postMessage({ type: 'NAVIGATE', url: targetUrl });
                        return Promise.resolve();
                    });
                } else {
                    // Use postMessage fallback
                    console.log("Navigate not supported, using postMessage");
                    client.postMessage({ type: 'NAVIGATE', url: targetUrl });
                    return Promise.resolve();
                }
            } else {
                // No controlled clients, open new window
                console.log("No controlled clients found, opening new window");
                if (clients.openWindow) {
                    return clients.openWindow(targetUrl);
                }
            }
        }).catch(err => {
            console.error("Error in notification click handler:", err);
            // Fallback to opening new window
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
