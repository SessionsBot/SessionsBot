import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast from 'vue-toastification'
import PrimeVue from 'primevue/config';
import Tooltip from 'primevue/tooltip';
import ConfirmationService from 'primevue/confirmationservice';

import App from './App.vue'

import { toastOptions } from './utils/toaster';
import primeVueConfig from './styles/primeVueTheme';
import router from './router'


// Import CSS:
import './styles/main.css'
import './styles/animations.css'
import 'primeicons/primeicons.css'
import "vue-toastification/dist/index.css";




// Configure & Mount App:
const app = createApp(App)


app.use(createPinia())
app.use(router)
app.use(Toast, toastOptions)
app.use(PrimeVue, primeVueConfig)
app.use(ConfirmationService)
app.directive('tool-tip', Tooltip);

app.mount('#app')
