import { createApp } from 'vue'
import { createPinia } from 'pinia'

import PrimeVue, { type PrimeVueConfiguration } from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import primeVueTheme from './styles/primeVueTheme'

import App from './App.vue'
import router from './router'

// Import CSS:
import './styles/main.css'
import './styles/animations.css'
import 'primeicons/primeicons.css'


// Configure & Mount App:
const app = createApp(App)

app.use(PrimeVue, <PrimeVueConfiguration>{
    theme: {
        preset: primeVueTheme,
        options: {
            darkModeSelector: '.dark'
        }
    },
    ripple: true,
    ptOptions: {
        mergeSections: true,
        mergeProps: true
    },
})

app.use(createPinia())
app.use(router)

app.mount('#app')
