"use client";

import { useEffect } from "react";

// Add workbox to Window interface
declare global {
  interface Window {
    workbox?: any;
  }
}

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Clear any existing caches first
      if (window.caches) {
        console.log("Clearing existing caches...");
        caches.keys().then((cacheNames) => {
          cacheNames.forEach((cacheName) => {
            if (cacheName.startsWith("bahnhofjaeger-")) {
              console.log(`Deleting cache: ${cacheName}`);
              caches.delete(cacheName);
            }
          });
        });
      }

      // Register the service worker with immediate control
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js", { updateViaCache: "none" })
          .then((registration) => {
            console.log(
              "Service Worker registered with scope:",
              registration.scope
            );

            // Check if we need to refresh for the new service worker
            if (registration.active) {
              // If there's an update, we'll need to reload
              registration.addEventListener("updatefound", () => {
                const newWorker = registration.installing;
                if (newWorker) {
                  newWorker.addEventListener("statechange", () => {
                    if (newWorker.state === "activated") {
                      console.log(
                        "New service worker activated, reloading for changes"
                      );
                      window.location.reload();
                    }
                  });
                }
              });
            }
          })
          .catch((err) => {
            console.error("Service Worker registration failed:", err);
          });
      });

      // Listen for controller changes
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("Service Worker controller changed");
      });
    }
  }, []);

  return null;
}
