const CACHE_NAME = "bite-me-v6";
const CACHE_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./game.js",
  "./manifest.webmanifest",
  "./assets/app-icon.svg",
  "./assets/human/human-3x3-clean.png",
  "./assets/wolf/wolf-3x3-clean.png",
  "./assets/shark/shark-3x3-clean.png",
  "./assets/audio/start.wav",
  "./assets/audio/tell.wav",
  "./assets/audio/blink.wav",
  "./assets/audio/escape.wav",
  "./assets/audio/close.wav",
  "./assets/audio/chomp.wav"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_FILES)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
