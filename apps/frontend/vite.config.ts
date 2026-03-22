import { fileURLToPath, URL } from 'node:url'
import pkgFile from './package.json'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite';
import { PrimeVueResolver } from '@primevue/auto-import-resolver';

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({}),
    vueDevTools(),
    tailwindcss({
      optimize: {
        minify: true
      }
    }),
    AutoImport({
      imports: ['vue', 'vue-router', '@vueuse/core'],
      dts: 'src/types/auto-vue-imports.d.ts'
    }),
    Components({
      resolvers: [
        PrimeVueResolver()
      ],
      dts: 'src/types/auto-component-imports.d.ts'
    }),
    cloudflare()
  ],
  define: {
    __APP_VERSION: JSON.stringify(pkgFile.version)
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  }
})