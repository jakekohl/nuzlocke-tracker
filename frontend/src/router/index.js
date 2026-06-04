import { createRouter, createWebHistory } from 'vue-router'

import SettingsView from '@/views/SettingsView.vue'
import ApiExplorerView from '@/views/ApiExplorerView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'settings',
      component: SettingsView,
    },
    {
      path: '/api',
      name: 'api-explorer',
      component: ApiExplorerView,
    },
  ],
})

export default router
