/* eslint-disable @typescript-eslint/ban-ts-comment */
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkFirst } from "serwist";

// Safari patch for FetchEvent.respondWith
const setupSafariPatch = () => {
  // Only apply in Safari browsers
  if (
    typeof navigator !== "undefined" &&
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  ) {
    const originalAddEventListener = self.addEventListener;
    self.addEventListener = function (
      type: string,
      listener: any,
      options?: any
    ) {
      if (type === "fetch") {
        const wrappedListener = function (event: any) {
          if (event.respondWith) {
            const originalRespondWith = event.respondWith;
            event.respondWith = function (response: any) {
              try {
                return originalRespondWith.call(this, response);
              } catch (error) {
                console.warn(
                  "Safari FetchEvent.respondWith error caught and handled:",
                  error
                );
                return originalRespondWith.call(self, response);
              }
            };
          }
          return listener(event);
        };
        return originalAddEventListener.call(
          this,
          type,
          wrappedListener,
          options
        );
      }
      return originalAddEventListener.call(this, type, listener, options);
    };
  }
};

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

// Use WorkerGlobalScope which is available in TypeScript lib.webworker.d.ts
declare const self: WorkerGlobalScope;

// Apply Safari patch
setupSafariPatch();

// Create custom runtime caching configuration
const runtimeCaching = [
  ...defaultCache,
  {
    // Match all navigation requests
    matcher: ({ request, url }: { request: Request; url: URL }) =>
      request.mode === "navigate",
    handler: new NetworkFirst({
      networkTimeoutSeconds: 10, // Timeout if network takes too long
      cacheName: "pages",
      plugins: [
        {
          // Cache successful responses
          cacheWillUpdate: async ({ response }) => {
            if (response && response.status === 200) {
              return response;
            }
            return null;
          },
        },
      ],
    }),
    options: {
      precacheFallback: {
        // If the network fails, try to serve from the precache
        fallbackURL: "/",
      },
    },
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: runtimeCaching,
  // Disable debug logs
  disableDevLogs: process.env.NODE_ENV === "production",
});

serwist.addEventListeners();
