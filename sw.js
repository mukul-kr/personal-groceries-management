// Offline support: app files are cached on install and served cache-first.
// Bump VERSION on every deploy so phones pick up the new files.
const VERSION = 'v2';
const CACHE = `solo-kitchen-${VERSION}`;
const FILES = [
  './', 'index.html', 'styles.css', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'src/ui/app.js', 'src/ui/components.js', 'src/ui/demo.js', 'src/ui/today.js', 'src/ui/cook.js', 'src/ui/meal.js',
  'src/ui/stock.js', 'src/ui/shop.js', 'src/ui/settings.js', 'src/ui/plus.js',
  'src/store/db.js',
  'src/core/dates.js', 'src/core/units.js', 'src/core/expiry.js', 'src/core/stock.js', 'src/core/rank.js',
  'src/core/forecast.js', 'src/core/shopping.js', 'src/core/changes.js', 'src/core/commands.js', 'src/core/seed.js', 'src/core/backup.js',
  'src/data/catalog.js', 'src/data/meals.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('solo-kitchen-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request)));
});
