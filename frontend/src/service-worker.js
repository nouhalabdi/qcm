
import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';


clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);


const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$');
registerRoute(
  ({ request, url }) => {
    if (request.mode !== 'navigate') return false;
    if (url.pathname.startsWith('/_')) return false;
    if (url.pathname.match(fileExtensionRegexp)) return false;
    return true;
  },
  createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html')
);


registerRoute(
  ({ url }) => url.origin === 'https://res.cloudinary.com',
  new CacheFirst({
    cacheName: 'cloudinary-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100, 
                maxAgeSeconds: 5 * 30 * 24 * 60 * 60,
      }),
    ],
  })
);

// 3. استراتيجية بيانات الـ QCMs والدروس (API)
// NetworkFirst: يحاول جلب أحدث البيانات من السيرفر. إذا لم يجد إنترنت، يجلب من الهاتف.
registerRoute(
  ({ url }) => url.href.includes('/api/quizzes') || url.href.includes('/api/lessons') || url.href.includes('/api/modules') || url.href.includes('/api/users'),
  new NetworkFirst({
    cacheName: 'api-data',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60, // لمدة 7 أيام
      }),
    ],
  })
);

// 4. استراتيجية الملفات الثابتة (الخطوط، الأيقونات، إلخ)
registerRoute(
  ({ request }) => request.destination === 'image' || request.destination === 'style' || request.destination === 'script' || request.destination === 'font',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);
