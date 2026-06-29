const CACHE_VERSION = "gym-calculator-v2";

// Shell assets to precache during install
const APP_SHELL = ["/", "/manifest.webmanifest", "/favicon.svg"];

// Install: precache the app shell, resilient to individual failures
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      Promise.allSettled(
        APP_SHELL.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`SW: failed to precache ${url}`, err);
          }),
        ),
      ),
    ),
  );
  self.skipWaiting();
});

// Activate: remove old caches, then take control of all clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Fetch: network-first for navigation, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  // Navigation requests: network-first with cached-shell fallback.
  // Also caches the latest page response so the shell stays fresh.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const cloned = response.clone();
          caches
            .open(CACHE_VERSION)
            .then((cache) => cache.put(request, cloned));
          return response;
        })
        .catch(() => caches.match("/")),
    );
    return;
  }

  // Static assets (/_astro/*.js, /_astro/*.css, icons, etc.):
  // cache-first with network fallback. Returns a 503 when offline and
  // uncached instead of silently serving HTML for JS/CSS requests.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Update the cache in the background while serving the cached copy
        fetch(request)
          .then((response) => {
            if (response?.status === 200) {
              caches
                .open(CACHE_VERSION)
                .then((cache) => cache.put(request, response.clone()));
            }
          })
          .catch(() => {
            // Network unavailable — nothing to update
          });
        return cached;
      }

      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }

          const cloned = response.clone();
          caches
            .open(CACHE_VERSION)
            .then((cache) => cache.put(request, cloned));
          return response;
        })
        .catch(() => new Response("Offline", { status: 503 }));
    }),
  );
});
