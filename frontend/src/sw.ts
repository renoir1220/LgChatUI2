/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;
// 关闭 Workbox 开发日志，避免控制台反复提示
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(self as any).__WB_DISABLE_DEV_LOGS = true;

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
