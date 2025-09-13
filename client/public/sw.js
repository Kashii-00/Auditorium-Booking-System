// Service Worker for Auditorium Booking System
// Provides caching strategies for better performance and offline functionality

const CACHE_NAME = 'auditorium-booking-v1.0.0'
const API_CACHE_NAME = 'auditorium-api-cache-v1.0.0'
const STATIC_CACHE_NAME = 'auditorium-static-cache-v1.0.0'

// Define what to cache
const STATIC_ASSETS = [
  '/erp/',
  '/erp/index.html',
  '/erp/assets/react.svg',
  '/erp/favicon.ico',
  '/erp/MPMA.png',
  '/erp/rounded_alpa.png'
]

// API endpoints to cache (with short TTL)
const API_ENDPOINTS = [
  '/erp/api/bookings',
  '/erp/api/courses',
  '/erp/api/batches',
  '/erp/api/students',
  '/erp/api/lecturers'
]

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
}

// Cache TTL (Time To Live) in milliseconds
const CACHE_TTL = {
  STATIC: 24 * 60 * 60 * 1000, // 24 hours
  API: 5 * 60 * 1000, // 5 minutes
  DYNAMIC: 60 * 60 * 1000 // 1 hour
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      }),
      // Cache shell for offline functionality
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching app shell')
        return cache.add('/erp/index.html')
      })
    ]).then(() => {
      console.log('Service Worker: Installation complete')
      // Force activation of new service worker
      return self.skipWaiting()
    }).catch((error) => {
      console.error('Service Worker: Installation failed', error)
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches
          if (cacheName !== CACHE_NAME && 
              cacheName !== API_CACHE_NAME && 
              cacheName !== STATIC_CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('Service Worker: Activation complete')
      // Take control of all pages immediately
      return self.clients.claim()
    })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return
  }

  event.respondWith(handleRequest(request))
})

// Main request handler with different strategies
async function handleRequest(request) {
  const url = new URL(request.url)
  const pathname = url.pathname

  try {
    // Strategy 1: Static assets (Cache First)
    if (isStaticAsset(pathname)) {
      return await cacheFirst(request, STATIC_CACHE_NAME, CACHE_TTL.STATIC)
    }

    // Strategy 2: API calls (Network First with short cache)
    if (isAPICall(pathname)) {
      return await networkFirst(request, API_CACHE_NAME, CACHE_TTL.API)
    }

    // Strategy 3: HTML pages (Stale While Revalidate)
    if (isHTMLPage(request)) {
      return await staleWhileRevalidate(request, CACHE_NAME, CACHE_TTL.DYNAMIC)
    }

    // Strategy 4: Dynamic content (Network First)
    return await networkFirst(request, CACHE_NAME, CACHE_TTL.DYNAMIC)

  } catch (error) {
    console.error('Service Worker: Request handling failed', error)
    
    // Fallback to offline page for HTML requests
    if (isHTMLPage(request)) {
      const cache = await caches.open(CACHE_NAME)
      const offlineResponse = await cache.match('/erp/index.html')
      return offlineResponse || new Response('Offline', { status: 503 })
    }

    // Return network error for other requests
    return new Response('Network Error', { 
      status: 503,
      statusText: 'Service Unavailable'
    })
  }
}

// Cache First strategy - good for static assets
async function cacheFirst(request, cacheName, ttl) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)

  if (cachedResponse && !isExpired(cachedResponse, ttl)) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      // Clone and cache the response
      const responseClone = networkResponse.clone()
      await cache.put(request, addTimestamp(responseClone))
    }
    return networkResponse
  } catch (error) {
    // Return cached version even if expired
    return cachedResponse || new Response('Offline', { status: 503 })
  }
}

// Network First strategy - good for API calls
async function networkFirst(request, cacheName, ttl) {
  const cache = await caches.open(cacheName)

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      // Clone and cache the response
      const responseClone = networkResponse.clone()
      await cache.put(request, addTimestamp(responseClone))
    }
    return networkResponse
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await cache.match(request)
    if (cachedResponse && !isExpired(cachedResponse, ttl)) {
      return cachedResponse
    }
    throw error
  }
}

// Stale While Revalidate strategy - good for dynamic content
async function staleWhileRevalidate(request, cacheName, ttl) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)

  // Fetch in background to update cache
  const networkPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone()
      cache.put(request, addTimestamp(responseClone))
    }
    return networkResponse
  }).catch(() => {
    // Ignore network errors in background update
  })

  // Return cached response immediately if available and not expired
  if (cachedResponse && !isExpired(cachedResponse, ttl)) {
    return cachedResponse
  }

  // Wait for network response if no valid cache
  return await networkPromise
}

// Helper functions
function isStaticAsset(pathname) {
  return pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/) ||
         STATIC_ASSETS.some(asset => pathname.includes(asset))
}

function isAPICall(pathname) {
  return pathname.includes('/api/') || 
         API_ENDPOINTS.some(endpoint => pathname.includes(endpoint))
}

function isHTMLPage(request) {
  return request.destination === 'document' || 
         request.headers.get('accept')?.includes('text/html')
}

function addTimestamp(response) {
  const headers = new Headers(response.headers)
  headers.set('sw-cache-timestamp', Date.now().toString())
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  })
}

function isExpired(response, ttl) {
  const timestamp = response.headers.get('sw-cache-timestamp')
  if (!timestamp) return true
  
  const age = Date.now() - parseInt(timestamp)
  return age > ttl
}

// Background sync for offline actions (if supported)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync())
  }
})

async function handleBackgroundSync() {
  try {
    // Handle any pending offline actions
    console.log('Service Worker: Processing background sync')
    
    // You can implement offline form submissions, data sync, etc.
    // For now, just log the event
  } catch (error) {
    console.error('Service Worker: Background sync failed', error)
  }
}

// Push notification handling (if needed)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/erp/MPMA.png',
      badge: '/erp/rounded_alpa.png',
      tag: 'auditorium-notification',
      renotify: true,
      requireInteraction: false,
      actions: [
        {
          action: 'view',
          title: 'View Details'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    }

    event.waitUntil(
      self.registration.showNotification(data.title || 'Auditorium Booking System', options)
    )
  }
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/erp/bookings')
    )
  }
})

// Message handling from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})

console.log('Service Worker: Script loaded successfully')
