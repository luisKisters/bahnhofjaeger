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
      // Register the service worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log(
            "Service Worker registered with scope:",
            registration.scope
          );
        })
        .catch((err) => {
          console.error("Service Worker registration failed:", err);
        });

      // Add event listeners for updates
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("Service Worker controller changed");
      });

      // Check for updates when online
      window.addEventListener("online", () => {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "CHECK_FOR_UPDATES",
          });
        }
      });
    }
  }, []);

  return null;
}
