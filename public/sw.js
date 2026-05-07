const CACHE_VERSION = "physical-kanban-sync-v0.1.0";
const APP_SHELL = [
  "/physical-kanban-sync/",
  "/physical-kanban-sync/index.html",
  "/physical-kanban-sync/manifest.webmanifest",
  "/physical-kanban-sync/icon.svg",
  "/physical-kanban-sync/scanner.worker.js",
  "/physical-kanban-sync/vendor/apriltag/apriltag_wasm.js",
  "/physical-kanban-sync/vendor/apriltag/apriltag_wasm.wasm",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          if (response.ok && new URL(request.url).origin === self.location.origin) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          if (request.mode === "navigate") {
            return caches.match("/physical-kanban-sync/index.html");
          }
          throw new Error("Offline and request is not cached.");
        });
    }),
  );
});
