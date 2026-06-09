const CACHE_NAME = 'econido-v3';
const RUNTIME_CACHE = 'econido-runtime-v3';
const API_CACHE = 'econido-api-v3';

// Assets a cachear en la instalación
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching precache assets');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache error (some assets may not be available):', err);
      });
    })
  );
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== API_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia de fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar solicitudes no-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar solicitudes de Chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // API calls: Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // HTML: Network first para actualizaciones
  if (request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(networkFirstStrategy(request, RUNTIME_CACHE));
    return;
  }

  // Assets (JS, CSS, imágenes): Cache first
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/i) ||
    url.pathname.includes('/_next/') ||
    url.pathname.includes('/assets/')
  ) {
    event.respondWith(cacheFirstStrategy(request, RUNTIME_CACHE));
    return;
  }

  // Default: Network first
  event.respondWith(networkFirstStrategy(request, RUNTIME_CACHE));
});

// Estrategia: Network first, fallback to cache
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);
    
    // Cachear respuestas exitosas
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache for:', request.url);
    const cached = await caches.match(request);
    
    if (cached) {
      return cached;
    }

    // Fallback para navegación
    if (request.mode === 'navigate') {
      const cachedHtml = await caches.match('/index.html');
      if (cachedHtml) {
        return cachedHtml;
      }
    }

    return new Response('Offline - Recurso no disponible', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Estrategia: Cache first, fallback to network
async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);
  
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed for:', request.url);
    return new Response('Offline - Recurso no disponible', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Background sync para sincronizar datos offline
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-inspections') {
    event.waitUntil(syncInspections());
  }
});

async function syncInspections() {
  try {
    console.log('[SW] Syncing offline inspections...');
    
    // Abrir IndexedDB
    const db = await openDB();
    const pendingInspections = await getPendingInspections(db);
    
    if (pendingInspections.length === 0) {
      console.log('[SW] No pending inspections to sync');
      return;
    }

    // Sincronizar cada inspección
    for (const inspection of pendingInspections) {
      try {
        const response = await fetch('/api/trpc/nestBox.createInspection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(inspection),
        });

        if (response.ok) {
          // Marcar como sincronizada
          await markInspectionSynced(db, inspection.id);
          console.log('[SW] Inspection synced:', inspection.id);
        }
      } catch (error) {
        console.error('[SW] Error syncing inspection:', error);
      }
    }

    // Notificar al cliente
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        synced: pendingInspections.length,
      });
    });
  } catch (error) {
    console.error('[SW] Sync error:', error);
    throw error;
  }
}

// Utilidades IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('EcoNidoDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingInspections')) {
        db.createObjectStore('pendingInspections', { keyPath: 'id' });
      }
    };
  });
}

function getPendingInspections(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingInspections'], 'readonly');
    const store = transaction.objectStore('pendingInspections');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function markInspectionSynced(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingInspections'], 'readwrite');
    const store = transaction.objectStore('pendingInspections');
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Mensaje desde el cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker loaded');
