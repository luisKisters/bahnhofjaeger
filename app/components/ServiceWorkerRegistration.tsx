"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    const registerSerwist = async () => {
      if ("serviceWorker" in navigator) {
        try {
          const { Serwist } = await import("@serwist/window");
          const serwist = new Serwist("/sw.js", {
            scope: "/",
            type: "classic",
          });

          serwist.addEventListener("installed", () => {
            console.log("Serwist service worker installed");
          });

          serwist.addEventListener("controlling", () => {
            console.log("Serwist service worker controlling");
          });

          serwist.addEventListener("waiting", (event) => {
            console.log("New service worker waiting to be activated");
            // Optional: You can notify users about a new version available
          });

          await serwist.register();
        } catch (error) {
          console.error("Service worker registration failed:", error);
        }
      }
    };

    registerSerwist();
  }, []);

  return null;
}
