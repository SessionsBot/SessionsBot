// https://vitepress.dev/guide/custom-theme
import { createPinia } from 'pinia'
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import CustomLayout from './customLayout.vue'
import './style.css'
import './custom.css'

const pinia = createPinia()


export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(CustomLayout)
  },
  enhanceApp({ app, router, siteData }) {

    // Use Pinia (stores):
    app.use(pinia)

  }
} satisfies Theme
