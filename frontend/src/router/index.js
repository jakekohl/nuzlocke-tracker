import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/HomeView.vue'
import SettingsView from '@/views/SettingsView.vue'
import RunsView from '@/views/RunsView.vue'
import RunDetailView from '@/views/RunDetailView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: 'Nuzlocke Tracker',
      },
    },
    {
      path: '/runs',
      name: 'runs',
      component: RunsView,
      meta: {
        title: 'Runs',
      },
    },
    {
      path: '/runs/:id',
      name: 'run-detail',
      component: RunDetailView,
      meta: {
        title: 'Run',
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
