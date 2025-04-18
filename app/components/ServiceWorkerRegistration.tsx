"use client";

import { useEffect, useState } from "react";

export function ServiceWorkerRegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const registerSerwist = async () => {
      if ("serviceWorker" in navigator) {
        try {
          const { Serwist } = await import("@serwist/window");

          // Unregister any existing service workers first to avoid conflicts
          const registrations =
            await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
          }

          // Register new service worker
          const serwist = new Serwist("/sw.js", {
            scope: "/",
            type: "classic",
          });

          serwist.addEventListener("installed", (event) => {
            console.log("Serwist service worker installed", event);
          });

          serwist.addEventListener("controlling", (event) => {
            console.log("Serwist service worker controlling", event);

            // Reload the page when the service worker takes control
            if (event.isUpdate) {
              window.location.reload();
            }
          });

          serwist.addEventListener("waiting", (event) => {
            console.log("New service worker waiting to be activated", event);
            setUpdateAvailable(true);
          });

          serwist.addEventListener("redundant", (event) => {
            console.log("Service worker became redundant", event);
          });

          await serwist.register();
          console.log("Service worker registration successful");
        } catch (error) {
          console.error("Service worker registration failed:", error);
        }
      }
    };

    registerSerwist();
  }, []);

  // Force update when new service worker is available
  const updateServiceWorker = () => {
    if ("serviceWorker" in navigator && window.location) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      });
    }
  };

  return updateAvailable ? (
    <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white p-2 text-center z-50">
      <p>New version available</p>
      <button
        onClick={updateServiceWorker}
        className="bg-white text-blue-600 px-4 py-1 rounded mt-1"
      >
        Update
      </button>
    </div>
  ) : null;
}
