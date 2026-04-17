self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : { 
    title: 'ShareRide Alert', 
    body: 'Safety network update received.' 
  };

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

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});