// Dev English service worker: shows daily reminder notifications and opens the app when tapped.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch (e) { data = { body: event.data && event.data.text() } }
  const title = data.title || 'Dev English'
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || 'Bora praticar 5 minutinhos?',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: 'daily-reminder',
    renotify: true,
    data: { url: data.url || '/' },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const c of all) { if ('focus' in c) { c.navigate && c.navigate(url).catch(() => {}); return c.focus() } }
    return self.clients.openWindow(url)
  })())
})
