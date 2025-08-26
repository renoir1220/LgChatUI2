import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

// https://vite.dev/config/
const API_TARGET = process.env.VITE_API_BASE || 'http://localhost:3000'

// HTTPS证书路径 (使用ES模块兼容方式)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const certPath = path.resolve(__dirname, '.cert/cert.pem')
const keyPath = path.resolve(__dirname, '.cert/key.pem')

export default defineConfig({
  define: (() => {
    try {
      const rootPkgPath = path.resolve(__dirname, '..', 'package.json')
      const pkgJson = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'))
      const version = pkgJson.version || '0.0.0'
      return { 'import.meta.env.VITE_APP_VERSION': JSON.stringify(version) }
    } catch {
      return { 'import.meta.env.VITE_APP_VERSION': JSON.stringify('0.0.0') }
    }
  })(),
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      // 由应用内 useRegisterSW 统一注册与更新提示，这里关闭自动注入
      injectRegister: null,
      registerType: 'autoUpdate',
      // includeAssets 由 globPatterns 覆盖，避免重复与不存在的文件
      manifest: false, // 使用public/manifest.webmanifest
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,svg,woff,woff2}'],
        globIgnores: ['**/config.js'] // 不缓存配置文件
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(fileURLToPath(new URL('.', import.meta.url)), './src'),
      '@types': path.resolve(fileURLToPath(new URL('.', import.meta.url)), './src/types'),
    },
  },
  server: {
    // 默认启用HTTPS用于PWA和Service Worker支持
    // 优先使用localhost证书，如果不存在则禁用HTTPS并给出提示
    https: fs.existsSync(certPath) ? {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    } : (() => {
      console.warn('⚠️  HTTPS证书文件不存在，正在使用HTTP模式');
      console.warn('💡 要启用HTTPS开发模式，请运行:');
      console.warn('   mkcert -install');
      console.warn('   mkcert -key-file .cert/key.pem -cert-file .cert/cert.pem localhost 127.0.0.1 ::1');
      return undefined;
    })(),
    host: '0.0.0.0', // 允许外部访问
    port: 5173,
    // 添加响应头支持Mixed Content
    headers: {
      'Referrer-Policy': 'no-referrer-when-downgrade',
      'Content-Security-Policy': '',  // 禁用CSP
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY'
    },
    proxy: {
      // Proxy backend endpoints during dev so relative fetch('/health/...') works
      '/health': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false, // 允许代理到HTTP后端
      },
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false, // 允许代理到HTTP后端
      },
    },
  },
})
