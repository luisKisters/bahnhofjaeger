// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/

const CACHE_NAME = "bahnhofjaeger-v1";
const OFFLINE_URL = "/offline";

// Files to cache
const urlsToCache = [
  "/",
  "/index.html",
  "/search",
  "/collection",
  "/offline",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Delete old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Delete old versioned caches
            return (
              cacheName.startsWith("bahnhofjaeger-") && cacheName !== CACHE_NAME
            );
          })
          .map((cacheName) => {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  // Tell the active service worker to take control of the page immediately
  self.clients.claim();
});

// Network first, falling back to cache strategy
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests and API requests
  if (
    !event.request.url.startsWith(self.location.origin) ||
    event.request.url.includes("/api/")
  ) {
    return;
  }

  // HTML navigation requests - network with offline fallback
  if (
    event.request.mode === "navigate" ||
    (event.request.method === "GET" &&
      event.request.headers.get("accept").includes("text/html"))
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If we got a valid response, clone it and cache it
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(async () => {
          // Try to get the page from the cache
          const cachedResponse = await caches.match(event.request);

          // Return cached page or offline page if available
          return cachedResponse || caches.match(OFFLINE_URL);
        })
    );
  } else {
    // For non-HTML requests, use regular network-first strategy
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If we got a valid response, clone it and cache it
          if (
            response &&
            response.status === 200 &&
            response.type === "basic"
          ) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(async () => {
          // Try to get from cache
          return await caches.match(event.request);
        })
    );
  }
});
