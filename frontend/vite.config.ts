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
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'favicon.ico', 'robots.txt', 'icons/*.png'],
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
    },
  },
  server: {
    // 支持HTTPS用于PWA测试，使用mkcert生成的证书
    // 优先使用localhost证书，如果不存在则不启用HTTPS
    https: process.env.VITE_HTTPS === 'true' && fs.existsSync(certPath) ? {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    } : process.env.VITE_HTTPS === 'true' ? (() => {
      console.warn('HTTPS模式已启用但证书文件不存在，将使用HTTP模式');
      console.warn('如需HTTPS开发，请运行: mkcert -install && mkcert localhost 127.0.0.1 ::1');
      return undefined;
    })() : undefined,
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
