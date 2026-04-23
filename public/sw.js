// ShareRide Background Service Worker
self.addEventListener('install', (event) => {
  console.log('ShareRide Service Worker installed.');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('ShareRide Service Worker activated.');
});

// Logic to handle incoming background push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'ShareRide Alert', body: 'New safety update from your circle.' };
  
  const options = {
    body: data.body,
    icon: 'https://i.postimg.cc/SxdPPWsv/cropped-circle-image-(1).png',
    badge: 'https://i.postimg.cc/SxdPPWsv/cropped-circle-image-(1).png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Open the app when notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});