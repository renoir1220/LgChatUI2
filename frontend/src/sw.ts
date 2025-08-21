/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

// 清理过时的缓存
cleanupOutdatedCaches();

// 立即获取控制权
clientsClaim();

// 预缓存静态资源
precacheAndRoute(self.__WB_MANIFEST);

// 处理导航请求 - 返回到index.html
const navigationRoute = new NavigationRoute(
  new NetworkFirst({
    cacheName: 'navigation-cache',
  })
);
registerRoute(navigationRoute);

// 简单的更新检测
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 不拦截API请求，让它们正常通过
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // 如果是API请求或跨域请求，不拦截
  if (url.pathname.startsWith('/api/') || 
      url.pathname.startsWith('/health') || 
      url.origin !== location.origin) {
    return;
  }
  
  // 对于favicon和manifest等静态资源，如果预缓存中没有，直接请求网络
  if (url.pathname === '/favicon.png' || 
      url.pathname === '/manifest.webmanifest' ||
      url.pathname === '/favicon.ico') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // 如果网络失败，返回一个空响应而不是错误
        return new Response('', { status: 204 });
      })
    );
    return;
  }
});

console.log('🎯 优化PWA Service Worker已激活');