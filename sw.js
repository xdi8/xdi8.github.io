// Cache static assets (notably the Xdi8 font) on the visitor's machine,
// so repeat visits are served from the local cache instead of re-downloading.
const CACHE = "static-v1";
const PRECACHE_URLS = ["/fonts/XEGOEPUAall.woff2"];
const FONT_RE = /\.(?:woff2?|ttf|otf|eot)$/i;
const ASSET_RE = /\.(?:css|js|mjs|svg|png|jpe?g|gif|webp|avif|ico)$/i;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((name) => name !== CACHE).map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Fonts: cache-first — once stored locally, never fetched from the network again.
  if (FONT_RE.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ||
        fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
      )
    );
    return;
  }

  // Other static assets: network-first, with the cache as offline fallback.
  if (ASSET_RE.test(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});
