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
      meta: {
        title: 'settings'
      }
    },
    {
      path: '/api',
      name: 'api-explorer',
      component: ApiExplorerView,
      meta: {
        title: 'API Explorer'
      }
    },
    {
      path: '/:pathMatch(.*)*',
      component: () => import('@/views/NotFound.vue'),
      meta: {
        title: 'Not Found',
      },
    }
  ],
})

export default router

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'NUZLOCKE TRACKER';
  next();
});
