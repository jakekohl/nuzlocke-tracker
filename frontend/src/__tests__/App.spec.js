import { describe, it, expect, beforeEach, vi } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import App from '../App.vue'
import HomeView from '../views/HomeView.vue'
import SettingsView from '../views/SettingsView.vue'
import { PrimeVueTestPlugin } from './primeVueTestPlugin'

describe('App', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
  })

  it('renders the home landing page', async () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: HomeView },
        { path: '/settings', component: SettingsView },
      ],
    })

    await router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), router, PrimeVueTestPlugin],
      },
    })

    expect(wrapper.text()).toContain('Nuzlocke Tracker')
    expect(wrapper.text()).toContain('Open runs')
    expect(wrapper.findAll('[data-test="brand-logo"]').length).toBeGreaterThanOrEqual(2)
    expect(wrapper.find('[data-test="site-footer"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="footer-github"]').attributes('href')).toBe(
      'https://github.com/jakekohl/nuzlocke-tracker',
    )
  })
})
