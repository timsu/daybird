const cacheName = '::listnote'
const version = 'v0.0.1'

self.addEventListener('install', function (event) {
  console.log('Service worker installed')
})

self.addEventListener('activate', (event) => {
  console.log('Service worker activated')
})

self.addEventListener('fetch', function (event) {
  event.respondWith(
    (async function () {
      try {
        const res = await fetch(event.request)
        if (event.request.method == 'GET' && event.request.url.startsWith('http')) {
          const cache = await caches.open('cache')
          cache.put(event.request.url, res.clone())
        }
        return res
      } catch (error) {
        return caches.match(event.request)
      }
    })()
  )
})
