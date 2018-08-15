// Service Worker
var cacheName = 'rarpPWA-step-4';
var dataCacheName = 'rarpData';

var filesToCache = [
  '/',
  '/index.html',
  '/scripts/app.js',
  '/styles/inline.css',
  '/images/ic_add_white_24px.svg',
  '/images/ic_refresh_white_24px.svg',
  'images/icon-128x128.png',
  'images/icon-144x144.png',
  'images/icon-152x152.png',
  'images/icon-192x192.png',
  'images/icon-256x256.png',
  'images/icon-512x512.png'
];

// Almacenar en caché los recursos del sitio
self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(filesToCache);
    })
  );
});

/*
  Actualizar la caché cada vez que cambie cualquiera de los archivos del
  shell de la app.
*/
self.addEventListener('activate', function(e) {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName && key !== dataCacheName) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

// Obtener el appSHELL y los HORARIOS desde la caché.
self.addEventListener('fetch', function(e) {
  console.log('[Service Worker] Fetch', e.request.url);

  var dataUrl = 'https://api-ratp.pierre-grimaud.fr/v3/schedules/';
  if (e.request.url.indexOf(dataUrl) > -1) {
    e.respondWith(
      caches.open(dataCacheName).then(function(cache) {
        return fetch(e.request).then(function(response){
          cache.put(e.request.url, response.clone());
          return response;
        });
      })
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(function(response) {
        return response || fetch(e.request);
      })
    );
  }
});
