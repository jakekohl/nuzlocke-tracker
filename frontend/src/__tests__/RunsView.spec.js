import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import RunsView from '../views/RunsView.vue'
import { useApiKeyStore } from '../stores/apiKey'

vi.mock('@/services/ApiClient', () => ({
  apiClient: {
    listRuns: vi.fn(),
    createRun: vi.fn(),
  },
}))

import { apiClient } from '@/services/ApiClient'

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/runs', name: 'runs', component: RunsView },
      { path: '/runs/:id', name: 'run-detail', component: { template: '<div />' } },
      { path: '/settings', name: 'settings', component: { template: '<div />' } },
    ],
  })
}

describe('RunsView', () => {
  let pinia
  let router

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    router = makeRouter()
    await router.push('/runs')
    await router.isReady()
    vi.mocked(apiClient.listRuns).mockReset()
    vi.mocked(apiClient.createRun).mockReset()
    HTMLDialogElement.prototype.showModal = vi.fn(function showModal() {
      this.setAttribute('open', '')
    })
    HTMLDialogElement.prototype.close = vi.fn(function close() {
      this.removeAttribute('open')
    })
  })

  it('prompts for an access key when none is configured', async () => {
    const wrapper = mount(RunsView, {
      global: { plugins: [pinia, router] },
    })
    await flushPromises()

    expect(wrapper.find('[data-test="runs-error"]').text()).toMatch(/access key/i)
    expect(wrapper.find('[data-test="runs-button-new"]').attributes('disabled')).toBeDefined()
    expect(apiClient.listRuns).not.toHaveBeenCalled()
  })

  it('lists runs from the API', async () => {
    const store = useApiKeyStore()
    await store.setApiKey('nuz_test')
    vi.mocked(apiClient.listRuns).mockResolvedValue({
      ok: true,
      status: 200,
      data: [
        {
          id: 7,
          name: 'Red Hardcore',
          gameId: 1,
          status: 1,
          startDate: 1_700_000_000,
        },
      ],
    })

    const wrapper = mount(RunsView, {
      global: { plugins: [pinia, router] },
    })
    await flushPromises()

    expect(apiClient.listRuns).toHaveBeenCalled()
    expect(wrapper.find('[data-test="runs-list"]').text()).toContain('Red Hardcore')
    expect(wrapper.find('[data-test="run-link-7"]').attributes('href')).toContain('/runs/7')
  })

  it('shows empty state when there are no runs', async () => {
    const store = useApiKeyStore()
    await store.setApiKey('nuz_test')
    vi.mocked(apiClient.listRuns).mockResolvedValue({ ok: true, status: 200, data: [] })

    const wrapper = mount(RunsView, {
      global: { plugins: [pinia, router] },
    })
    await flushPromises()

    expect(wrapper.find('[data-test="runs-empty"]').text()).toMatch(/no runs yet/i)
  })
})
