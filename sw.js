// Service worker de Cuisine Carnage : rend le jeu installable et jouable
// hors ligne. Le jeu est statique, donc cache d'abord, réseau ensuite.
const CACHE = 'cuisine-carnage-v1';

const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './styles/main.css',
  './vendor/phaser.min.js',
  './vendor/symbols.js',
  './src/main.js',
  './src/haptics.js',
  './src/icons.js',
  './src/sfx.js',
  './src/theme.js',
  './src/art/PixelRenderer.js',
  './src/art/palette.js',
  './src/art/sprites.js',
  './src/scenes/BootScene.js',
  './src/scenes/GameScene.js',
  './assets/icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((hit) => hit ||
      fetch(e.request).then((res) => {
        if (res && res.status === 200 && e.request.method === 'GET') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match('./index.html'))));
});