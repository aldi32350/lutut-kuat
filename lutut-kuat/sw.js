// Service worker: menyimpan file agar aplikasi bisa dipakai offline.
// Naikkan nomor versi setiap kali Anda mengubah file aplikasi.
const CACHE = "lutut-kuat-v5";
const FILES = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/secret.js",
  "./js/config.js",
  "./js/license.js",
  "./js/data.js",
  "./img/qris.png",
  "./js/figure.js",
  "./js/app.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./img/pembuka.jpg",
  "./img/beranda.jpg",
  "./img/selesai.jpg",
  "./img/pemanasan-pagi.jpg",
  "./img/kuat-duduk.jpg",
  "./img/kuat-berdiri.jpg",
  "./img/di-kasur.jpg",
  "./img/peregangan-santai.jpg",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

// Jaringan dulu (agar update cepat terlihat), cadangan dari cache saat offline.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("./index.html")))
  );
});
