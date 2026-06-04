import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useApiKeyStore } from './stores/apiKey'

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(router)

  await useApiKeyStore(pinia).hydrateFromStorage()
  app.mount('#app')
}

bootstrap()
