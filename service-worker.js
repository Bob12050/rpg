const CACHE_NAME = "solo-hack-rpg-v21";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./js/main.js",
  "./js/state.js",
  "./js/render.js",
  "./js/battle.js",
  "./js/craft.js",
  "./js/equipment.js",
  "./js/job.js",
  "./js/loot.js",
  "./js/skill.js",
  "./js/stage.js",
  "./data/player.json",
  "./data/enemies.json",
  "./data/equipment.json",
  "./data/enhancement.json",
  "./data/jobs.json",
  "./data/loot.json",
  "./data/skills.json",
  "./data/stages.json",
  "./assets/images/icon-192.png",
  "./assets/images/icon-512.png",
  "./assets/images/enemies/forest_slime.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
