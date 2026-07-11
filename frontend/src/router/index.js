import { createRouter, createWebHistory } from 'vue-router'

import SettingsView from '@/views/SettingsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'settings',
      component: SettingsView,
      meta: {
        title: 'Settings',
      },
    },
    {
      path: '/settings',
      redirect: '/',
    },
    {
      path: '/:pathMatch(.*)*',
      component: () => import('@/views/NotFound.vue'),
      meta: {
        title: 'Not Found',
      },
    },
  ],
})

export default router

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'Nuzlocke Tracker'
  next()
})
