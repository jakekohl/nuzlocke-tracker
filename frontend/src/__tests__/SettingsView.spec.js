import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import SettingsView from '../views/SettingsView.vue'
import { useApiKeyStore } from '../stores/apiKey'

vi.mock('@/services/ApiClient', () => ({
  apiClient: {
    getMe: vi.fn(),
  },
}))

import { apiClient } from '@/services/ApiClient'

describe('SettingsView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(apiClient.getMe).mockReset()
    HTMLDialogElement.prototype.showModal = vi.fn(function showModal() {
      this.setAttribute('open', '')
    })
    HTMLDialogElement.prototype.close = vi.fn(function close() {
      this.removeAttribute('open')
    })
  })

  it('shows missing key status by default', () => {
    const wrapper = mount(SettingsView)
    expect(wrapper.find('[data-test="api-key-status-missing"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="api-button-verify"]').attributes('disabled')).toBeDefined()
  })

  it('verifies connection and shows user email on success', async () => {
    const store = useApiKeyStore()
    await store.setApiKey('nuz_testkey')
    vi.mocked(apiClient.getMe).mockResolvedValue({
      ok: true,
      status: 200,
      data: { id: 1, name: 'Jake', email: 'jake@example.com' },
    })

    const wrapper = mount(SettingsView)
    await wrapper.find('[data-test="api-button-verify"]').trigger('click')
    await flushPromises()

    expect(apiClient.getMe).toHaveBeenCalled()
    expect(wrapper.find('[data-test="verify-message"]').text()).toContain('jake@example.com')
    expect(wrapper.find('[data-test="verified-user"]').text()).toContain('Jake')
  })

  it('shows an error when verification is unauthorized', async () => {
    const store = useApiKeyStore()
    await store.setApiKey('nuz_bad')
    vi.mocked(apiClient.getMe).mockResolvedValue({
      ok: false,
      status: 401,
      data: { message: 'Unauthorized' },
    })

    const wrapper = mount(SettingsView)
    await wrapper.find('[data-test="api-button-verify"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="verify-error"]').text()).toMatch(/rejected|Unauthorized/i)
  })
})
