import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import RunDetailView from '../views/RunDetailView.vue'
import { useApiKeyStore } from '../stores/apiKey'
import { PrimeVueTestPlugin } from './primeVueTestPlugin'

vi.mock('@/services/ApiClient', () => ({
  apiClient: {
    getRun: vi.fn(),
    getRunRulesCatalog: vi.fn(),
    listEncounters: vi.fn(),
    listPokemon: vi.fn(),
    listRoutes: vi.fn(),
    updateRun: vi.fn(),
    deleteRun: vi.fn(),
    createEncounter: vi.fn(),
    updateEncounter: vi.fn(),
    evolveEncounter: vi.fn(),
    undoEvolveEncounter: vi.fn(),
    deleteEncounter: vi.fn(),
  },
}))

import { apiClient } from '@/services/ApiClient'

const sampleRun = {
  id: 3,
  name: 'Blue Softcore',
  gameId: 2,
  status: 1,
  startDate: 1_700_000_000,
  notes: 'Dupes on',
  rules: {
    firstEncounterOnly: true,
    permadeath: true,
    nicknameRequired: true,
    setMode: false,
  },
}

const sampleRules = {
  rules: [
    {
      key: 'firstEncounterOnly',
      label: 'First encounter only',
      description: 'Only first wild',
      category: 'core',
      default: true,
    },
    {
      key: 'permadeath',
      label: 'Permadeath',
      description: 'Faint = dead',
      category: 'core',
      default: true,
    },
    {
      key: 'nicknameRequired',
      label: 'Nicknames required',
      description: 'Nickname all',
      category: 'core',
      default: true,
    },
    {
      key: 'setMode',
      label: 'Set mode',
      description: 'No free switch',
      category: 'optional',
      default: false,
    },
  ],
  presets: [],
}

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/runs', name: 'runs', component: { template: '<div />' } },
      { path: '/runs/:id', name: 'run-detail', component: RunDetailView },
      { path: '/settings', name: 'settings', component: { template: '<div />' } },
    ],
  })
}

function mockHappyPathApis() {
  vi.mocked(apiClient.getRun).mockResolvedValue({ ok: true, status: 200, data: sampleRun })
  vi.mocked(apiClient.getRunRulesCatalog).mockResolvedValue({
    ok: true,
    status: 200,
    data: sampleRules,
  })
  vi.mocked(apiClient.listEncounters).mockResolvedValue({ ok: true, status: 200, data: [] })
  vi.mocked(apiClient.listPokemon).mockResolvedValue({
    ok: true,
    status: 200,
    data: [
      {
        id: 16,
        name: 'Pidgey',
        generation: 1,
        types: ['normal', 'flying'],
        evolutionFamilyId: 16,
        evolvesFromId: null,
      },
      {
        id: 17,
        name: 'Pidgeotto',
        generation: 1,
        types: ['normal', 'flying'],
        evolutionFamilyId: 16,
        evolvesFromId: 16,
      },
    ],
  })
  vi.mocked(apiClient.listRoutes).mockResolvedValue({
    ok: true,
    status: 200,
    data: [
      {
        id: 2,
        name: 'Route 1',
        slug: 'route-1',
        region: 'kanto',
        gameIds: [1, 2],
        sortOrder: 20,
        encounterType: 'wild',
      },
    ],
  })
}

function mountPage(pinia, router) {
  return mount(RunDetailView, {
    global: { plugins: [pinia, router, PrimeVueTestPlugin] },
  })
}

async function openTab(wrapper, testId) {
  await wrapper.find(`[data-test="${testId}"]`).trigger('click')
  await flushPromises()
}

describe('RunDetailView', () => {
  let pinia
  let router

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    router = makeRouter()
    await router.push('/runs/3')
    await router.isReady()
    vi.clearAllMocks()
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    )
  })

  it('prompts for an access key when none is configured', async () => {
    const wrapper = mountPage(pinia, router)
    await flushPromises()

    expect(wrapper.find('[data-test="run-detail-error"]').text()).toMatch(/access key/i)
    expect(apiClient.getRun).not.toHaveBeenCalled()
  })

  it('renders location checklist, rules, and notes', async () => {
    const store = useApiKeyStore()
    await store.setApiKey('nuz_test')
    mockHappyPathApis()

    const wrapper = mountPage(pinia, router)
    await flushPromises()

    expect(wrapper.find('[data-test="run-detail-name"]').text()).toBe('Blue Softcore')
    expect(wrapper.find('[data-test="run-detail-status"]').text()).toMatch(/active/i)
    expect(wrapper.find('[data-test="run-locations"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="location-row-2"]').text()).toContain('Route 1')

    await wrapper.find('[data-test="run-button-edit-meta"]').trigger('click')
    await flushPromises()
    const nameInput = wrapper.find('[data-test="run-edit-name"]')
    expect(nameInput.element.value ?? nameInput.find('input').element.value).toBe('Blue Softcore')

    await openTab(wrapper, 'run-tab-notes')
    const notesInput = wrapper.find('[data-test="run-edit-notes"]')
    expect(notesInput.element.value ?? notesInput.find('textarea').element.value).toBe('Dupes on')

    await openTab(wrapper, 'run-tab-rules')
    expect(wrapper.find('[data-test="run-rule-setMode"]').element.checked).toBe(false)
    expect(wrapper.find('[data-test="run-rule-permadeath"]').element.checked).toBe(true)
  })

  it('saves run meta from the banner edit mode', async () => {
    const store = useApiKeyStore()
    await store.setApiKey('nuz_test')
    mockHappyPathApis()
    vi.mocked(apiClient.updateRun).mockResolvedValue({
      ok: true,
      status: 200,
      data: { ...sampleRun, name: 'Blue Hardcore', status: 2 },
    })

    const wrapper = mountPage(pinia, router)
    await flushPromises()

    await wrapper.find('[data-test="run-button-edit-meta"]').trigger('click')
    await flushPromises()

    const nameInput = wrapper.find('[data-test="run-edit-name"]')
    await nameInput.setValue('Blue Hardcore')
    await wrapper.find('[data-test="run-button-save-meta"]').trigger('click')
    await flushPromises()

    expect(apiClient.updateRun).toHaveBeenCalledWith(
      '3',
      expect.objectContaining({
        name: 'Blue Hardcore',
        status: 1,
        startDate: expect.any(String),
      }),
    )
    expect(wrapper.find('[data-test="run-detail-name"]').text()).toBe('Blue Hardcore')
    expect(wrapper.find('[data-test="run-button-edit-meta"]').exists()).toBe(true)
  })

  it('saves notes from the Notes tab', async () => {
    const store = useApiKeyStore()
    await store.setApiKey('nuz_test')
    mockHappyPathApis()
    vi.mocked(apiClient.updateRun).mockResolvedValue({
      ok: true,
      status: 200,
      data: { ...sampleRun, notes: 'Updated notes' },
    })

    const wrapper = mountPage(pinia, router)
    await flushPromises()
    await openTab(wrapper, 'run-tab-notes')

    await wrapper.find('[data-test="run-edit-notes"]').setValue('Updated notes')
    await wrapper.find('[data-test="run-button-save-notes"]').trigger('click')
    await flushPromises()

    expect(apiClient.updateRun).toHaveBeenCalledWith('3', { notes: 'Updated notes' })
  })

  it('saves rule changes via updateRun', async () => {
    const store = useApiKeyStore()
    await store.setApiKey('nuz_test')
    mockHappyPathApis()
    vi.mocked(apiClient.updateRun).mockResolvedValue({
      ok: true,
      status: 200,
      data: { ...sampleRun, rules: { ...sampleRun.rules, setMode: true } },
    })

    const wrapper = mountPage(pinia, router)
    await flushPromises()
    await openTab(wrapper, 'run-tab-rules')

    await wrapper.find('[data-test="run-rule-setMode"]').setValue(true)
    await wrapper.find('[data-test="run-button-save-rules"]').trigger('click')
    await flushPromises()

    expect(apiClient.updateRun).toHaveBeenCalledWith(
      '3',
      expect.objectContaining({
        rules: expect.objectContaining({ setMode: true, permadeath: true }),
      }),
    )
  })

  it('archives a run with soft delete and navigates to list', async () => {
    const store = useApiKeyStore()
    await store.setApiKey('nuz_test')
    mockHappyPathApis()
    vi.mocked(apiClient.deleteRun).mockResolvedValue({
      ok: true,
      status: 200,
      data: { ...sampleRun, inactive: 1_700_000_100 },
    })
    const pushSpy = vi.spyOn(router, 'push')

    const wrapper = mountPage(pinia, router)
    await flushPromises()

    await wrapper.find('[data-test="run-button-archive"]').trigger('click')
    await flushPromises()

    expect(apiClient.deleteRun).toHaveBeenCalledWith('3')
    expect(pushSpy).toHaveBeenCalledWith({ name: 'runs' })
  })

  it('shows not found for missing runs', async () => {
    const store = useApiKeyStore()
    await store.setApiKey('nuz_test')
    await router.push('/runs/99')
    await router.isReady()

    vi.mocked(apiClient.getRun).mockResolvedValue({
      ok: false,
      status: 404,
      data: { message: 'Run not found' },
    })
    vi.mocked(apiClient.getRunRulesCatalog).mockResolvedValue({
      ok: true,
      status: 200,
      data: { rules: [] },
    })
    vi.mocked(apiClient.listEncounters).mockResolvedValue({ ok: true, status: 200, data: [] })

    const wrapper = mountPage(pinia, router)
    await flushPromises()

    expect(wrapper.find('[data-test="run-detail-error"]').text()).toMatch(/not found/i)
  })
})
