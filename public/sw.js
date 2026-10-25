// Service worker de GoRam Clinic: recibe los avisos push aunque la app este
// cerrada y abre la pantalla correcta al tocarlos. No guarda datos clinicos
// en cache: solo la pagina de "sin conexion".

const CACHE = 'goram-shell-v1'
const SIN_CONEXION = '/sin-conexion.html'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll([SIN_CONEXION, '/iconos/icono-192.png'])))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

// Solo navegaciones: si no hay red, una pagina amable en vez del error del navegador.
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return
  event.respondWith(fetch(event.request).catch(() => caches.match(SIN_CONEXION)))
})

self.addEventListener('push', (event) => {
  let datos = {}
  try {
    datos = event.data ? event.data.json() : {}
  } catch {
    datos = { title: 'GoRam Clinic', body: event.data ? event.data.text() : '' }
  }
  event.waitUntil(
    self.registration.showNotification(datos.title || 'GoRam Clinic', {
      body: datos.body || '',
      icon: '/iconos/icono-192.png',
      badge: '/iconos/insignia-96.png',
      tag: datos.tag || undefined,
      renotify: Boolean(datos.tag),
      vibrate: [120, 60, 120],
      lang: 'es-SV',
      data: { url: datos.url || '/panel' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const destino = new URL(event.notification.data?.url || '/panel', self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      for (const v of ventanas) {
        if (v.url.startsWith(self.location.origin)) {
          return v.focus().then(() => v.navigate(destino))
        }
      }
      return self.clients.openWindow(destino)
    }),
  )
})
