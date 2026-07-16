import { createRouter, createWebHistory } from 'vue-router'

import Home from '@/views/Home.vue'
import SettingsView from '@/views/SettingsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      meta: {
        title: 'Nuzlocke Tracker',
      },
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
      meta: {
        title: 'Settings',
      },
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
