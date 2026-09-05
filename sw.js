/* =========================================================
   MAROMBA — service worker
   Cache simples "cache-first, com atualização em segundo
   plano" dos arquivos estáticos, pra funcionar offline.
   Suba a versão do CACHE_NAME sempre que mudar algum arquivo
   estático, senão o navegador continua servindo a versão
   antiga do cache.
   ========================================================= */

const CACHE_NAME = 'maromba-cache-v1';
const ARQUIVOS_ESTATICOS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './bodymap.js',
  './data.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ARQUIVOS_ESTATICOS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(
        nomes.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

// Cache-first para os arquivos do app; qualquer coisa que não
// esteja na lista (ex.: uma requisição externa) vai direto pra rede.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request)
        .then(resp => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return resp;
        })
        .catch(() => cached); // offline: cai pro que tiver em cache

      // responde rápido com o cache se existir, e atualiza em segundo plano
      return cached || networkFetch;
    })
  );
});
