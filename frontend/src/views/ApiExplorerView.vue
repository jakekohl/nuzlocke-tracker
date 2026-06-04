<script setup>
import { ref } from 'vue'
import { apiClient } from '@/services/ApiClient'
import { runStatuses } from '@/constants/runStatuses'

const defaultCreateRunBody = {
  name: 'Sample Nuzlocke',
  startDate: Math.floor(Date.now() / 1000),
  userId: 1,
  gameId: 1,
  status: runStatuses.notStarted,
  notes: '',
}

const endpoints = [
  {
    id: 'create-run',
    method: 'POST',
    path: '/api/runs',
    summary: 'Create a run',
    description: 'Creates a new nuzlocke run record.',
    execute: (body) => apiClient.createRun(body),
    hasBody: true,
    defaultBody: defaultCreateRunBody,
  },
  {
    id: 'get-run',
    method: 'GET',
    path: '/api/runs/{id}',
    summary: 'Get run by ID',
    description: 'Returns a single run by its numeric id.',
    execute: (params) => apiClient.getRun(params.id),
    pathParams: [{ key: 'id', label: 'Run ID', default: '1' }],
  },
]

const bodyDrafts = ref(
  Object.fromEntries(
    endpoints.filter((e) => e.hasBody).map((e) => [e.id, JSON.stringify(e.defaultBody, null, 2)]),
  ),
)

const pathParamDrafts = ref(
  Object.fromEntries(
    endpoints
      .filter((e) => e.pathParams)
      .map((e) => [
        e.id,
        Object.fromEntries(e.pathParams.map((p) => [p.key, p.default])),
      ]),
  ),
)

const results = ref({})
const loading = ref({})
const errors = ref({})

function resolvedPath(endpoint) {
  let path = endpoint.path
  const params = pathParamDrafts.value[endpoint.id]
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`{${key}}`, encodeURIComponent(value))
    }
  }
  return path
}

async function executeEndpoint(endpoint) {
  loading.value[endpoint.id] = true
  errors.value[endpoint.id] = null
  results.value[endpoint.id] = null

  try {
    let result

    if (endpoint.hasBody) {
      const raw = bodyDrafts.value[endpoint.id]
      const body = JSON.parse(raw)
      result = await endpoint.execute(body)
    } else if (endpoint.pathParams) {
      const params = pathParamDrafts.value[endpoint.id]
      if (!params.id?.toString().trim()) {
        throw new Error('Run ID is required')
      }
      result = await endpoint.execute(params)
    } else {
      result = await endpoint.execute()
    }

    results.value[endpoint.id] = result
  } catch (err) {
    errors.value[endpoint.id] =
      err instanceof SyntaxError
        ? 'Request body must be valid JSON.'
        : (err.message ?? String(err))
  } finally {
    loading.value[endpoint.id] = false
  }
}

function formatResult(result) {
  return JSON.stringify(result, null, 2)
}

function statusClass(status) {
  if (status >= 200 && status < 300) return 'status-badge--ok'
  if (status >= 400 && status < 500) return 'status-badge--client'
  if (status >= 500) return 'status-badge--server'
  return ''
}
</script>

<template>
  <main class="explorer">
    <header class="explorer__header">
      <h1>API Explorer</h1>
      <p class="explorer__intro">
        Try backend endpoints with your configured API key. Requests use
        <code>x-api-key</code> automatically.
      </p>
    </header>

    <section
      v-for="endpoint in endpoints"
      :key="endpoint.id"
      class="endpoint"
      :aria-labelledby="`${endpoint.id}-title`"
    >
      <div class="endpoint__head">
        <span class="method" :class="`method--${endpoint.method.toLowerCase()}`">
          {{ endpoint.method }}
        </span>
        <code class="endpoint__path" :id="`${endpoint.id}-title`">{{ resolvedPath(endpoint) }}</code>
      </div>

      <p class="endpoint__summary">{{ endpoint.summary }}</p>
      <p v-if="endpoint.description" class="endpoint__description">{{ endpoint.description }}</p>

      <div v-if="endpoint.pathParams" class="endpoint__params">
        <label
          v-for="param in endpoint.pathParams"
          :key="param.key"
          class="field"
          :for="`${endpoint.id}-${param.key}`"
        >
          {{ param.label }}
          <input
            :id="`${endpoint.id}-${param.key}`"
            v-model="pathParamDrafts[endpoint.id][param.key]"
            type="text"
            class="field__input field__input--short"
          />
        </label>
      </div>

      <div v-if="endpoint.hasBody" class="endpoint__body">
        <label class="field" :for="`${endpoint.id}-body`">Request body (JSON)</label>
        <textarea
          :id="`${endpoint.id}-body`"
          v-model="bodyDrafts[endpoint.id]"
          class="field__textarea"
          rows="10"
          spellcheck="false"
        />
      </div>

      <button
        type="button"
        class="btn btn--execute"
        :disabled="loading[endpoint.id]"
        @click="executeEndpoint(endpoint)"
      >
        {{ loading[endpoint.id] ? 'Sending…' : 'Execute' }}
      </button>

      <p v-if="errors[endpoint.id]" class="response response--error" role="alert">
        {{ errors[endpoint.id] }}
      </p>

      <div v-if="results[endpoint.id]" class="response">
        <div class="response__meta">
          <span
            class="status-badge"
            :class="statusClass(results[endpoint.id].status)"
          >
            {{ results[endpoint.id].status }}
            {{ results[endpoint.id].statusText }}
          </span>
          <span class="response__time">{{ results[endpoint.id].elapsed }} ms</span>
        </div>
        <pre class="response__body">{{ formatResult(results[endpoint.id].data) }}</pre>
      </div>
    </section>
  </main>
</template>

<style scoped>
.explorer {
  max-width: 48rem;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}

.explorer__header h1 {
  margin: 0 0 0.5rem;
}

.explorer__intro {
  margin: 0 0 1.5rem;
  color: #555;
  line-height: 1.5;
}

.endpoint {
  margin-bottom: 1.5rem;
  padding: 1.25rem;
  border: 1px solid #e0e0e0;
  border-radius: 0.5rem;
  background: #fafafa;
}

.endpoint__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.method {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.method--get {
  background: #e3f2fd;
  color: #0d47a1;
}

.method--post {
  background: #e8f5e9;
  color: #1b5e20;
}

.endpoint__path {
  font-size: 0.95rem;
}

.endpoint__summary {
  margin: 0 0 0.25rem;
  font-weight: 600;
}

.endpoint__description {
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: #666;
}

.endpoint__params {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.field__input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ccc;
  border-radius: 0.375rem;
  font: inherit;
  font-weight: 400;
}

.field__input--short {
  width: 8rem;
}

.field__textarea {
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 1rem;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 0.375rem;
  font-family: ui-monospace, monospace;
  font-size: 0.8125rem;
  line-height: 1.4;
  resize: vertical;
}

.btn {
  padding: 0.5rem 1.25rem;
  border: 1px solid #ccc;
  border-radius: 0.375rem;
  background: #fff;
  cursor: pointer;
  font: inherit;
}

.btn--execute {
  border-color: #1976d2;
  background: #1976d2;
  color: #fff;
}

.btn--execute:hover:not(:disabled) {
  background: #1565c0;
}

.btn--execute:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.response {
  margin-top: 1rem;
}

.response--error {
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  background: #ffebee;
  color: #b71c1c;
}

.response__meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.8125rem;
  font-weight: 600;
  background: #eee;
}

.status-badge--ok {
  background: #e8f5e9;
  color: #1b5e20;
}

.status-badge--client {
  background: #fff3e0;
  color: #e65100;
}

.status-badge--server {
  background: #ffebee;
  color: #b71c1c;
}

.response__time {
  font-size: 0.8125rem;
  color: #666;
}

.response__body {
  margin: 0;
  padding: 1rem;
  overflow-x: auto;
  border-radius: 0.375rem;
  background: #263238;
  color: #eceff1;
  font-size: 0.8125rem;
  line-height: 1.45;
}
</style>
