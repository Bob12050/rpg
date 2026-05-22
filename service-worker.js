// =====================================================================
// service-worker.js ―― PWAのオフライン対応
// 主要ファイルをキャッシュし、次回以降オフラインでも起動できるようにする。
// ※ファイルを更新したら、下の CACHE 名のバージョン(v1→v2…)を上げると確実に反映される。
// =====================================================================

const CACHE = "rpg-cache-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/main.js",
  "./js/state.js",
  "./js/render.js",
  "./data/player.json",
  "./manifest.json"
];

// インストール時：主要ファイルを先読みキャッシュ
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

// 有効化時：古いキャッシュを掃除
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 取得時：キャッシュ優先、無ければネット
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request))
  );
});
