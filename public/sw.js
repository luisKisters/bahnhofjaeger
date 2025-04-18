// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/

const CACHE_NAME = "bahnhofjaeger-v1";
const OFFLINE_URL = "/offline";

// Files to cache immediately on install
const CORE_ASSETS = [
  "/",
  "/offline",
  "/search",
  "/collection",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/styles.css", // If you have a specific CSS file
];

// Install event - cache core assets
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Install");

  // Precache core assets
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[ServiceWorker] Caching core assets");
        cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        console.log("[ServiceWorker] Skip waiting");
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activate");

  event.waitUntil(
    // Get all cache keys
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete any old caches
            if (cacheName !== CACHE_NAME) {
              console.log("[ServiceWorker] Removing old cache", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Ensure the service worker takes control immediately
        console.log("[ServiceWorker] Claiming clients");
        return self.clients.claim();
      })
  );
});

// Fetch event - respond with cache then network strategy for navigation
self.addEventListener("fetch", (event) => {
  // Skip requests that aren't GET or aren't same-origin
  if (
    event.request.method !== "GET" ||
    !event.request.url.startsWith(self.location.origin)
  ) {
    return;
  }

  // For API requests, let the app handle them (they use IndexedDB)
  if (event.request.url.includes("/api/")) {
    return;
  }

  // For page navigations (HTML requests)
  if (
    event.request.mode === "navigate" ||
    (event.request.headers.get("accept") &&
      event.request.headers.get("accept").includes("text/html"))
  ) {
    event.respondWith(
      // Try the network first
      fetch(event.request)
        .then((response) => {
          // If successful, clone the response for the cache
          if (response && response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              console.log(
                "[ServiceWorker] Caching new resource:",
                event.request.url
              );
              cache.put(event.request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try the cache
          console.log(
            "[ServiceWorker] Fetching from cache for:",
            event.request.url
          );
          return caches.match(event.request).then((cachedResponse) => {
            // Return cached response or offline page
            if (cachedResponse) {
              console.log(
                "[ServiceWorker] Returning cached response for:",
                event.request.url
              );
              return cachedResponse;
            }

            console.log("[ServiceWorker] Showing offline page");
            return caches.match(OFFLINE_URL);
          });
        })
    );
  } else {
    // For all other requests (CSS, JavaScript, images, etc.)
    event.respondWith(
      // Check the cache first
      caches.match(event.request).then((cachedResponse) => {
        // Return cached response if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise try the network
        return fetch(event.request).then((response) => {
          // If successful, clone the response for the cache
          if (response && response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clonedResponse);
            });
          }
          return response;
        });
      })
    );
  }
});
