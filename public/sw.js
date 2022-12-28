self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('push', async (event) => {
  const { data } = event;

  if (data) {
    try {
      const displayData = await data.json();
      const { title, options } = displayData;

      event.waitUntil(self.registration
        .showNotification(title, {
          ...options,
          requireInteraction: true,
        })
        .then(() => {
          console.log('Notification displayed!');
        }),);
    } catch (e) {
      console.error('error!', e);
    }
  }
});
