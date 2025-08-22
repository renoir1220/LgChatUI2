/// <reference types="vite/client" />

// 为 vite-plugin-pwa 的虚拟模块提供类型声明
declare module 'virtual:pwa-register/react' {
  export interface UseRegisterSWOptions {
    immediate?: boolean
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void
    onRegisterError?: (error: Error) => void
  }
  export function useRegisterSW(options?: UseRegisterSWOptions): {
    needRefresh: [boolean, (v: boolean) => void]
    offlineReady: [boolean, (v: boolean) => void]
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>
  }
}
