<script setup>
import { computed } from 'vue'

const props = defineProps({
  catalog: { type: Array, required: true },
  saving: { type: Boolean, default: false },
})

const editRules = defineModel({ type: Object, required: true })

const emit = defineEmits(['save', 'preset'])

const RULE_CATEGORY_LABELS = {
  core: 'Core',
  optional: 'Optional',
  hardcore: 'Hardcore',
  softener: 'Softeners',
}

const sortedRules = computed(() =>
  [...props.catalog].sort((a, b) => {
    const order = { core: 0, optional: 1, hardcore: 2, softener: 3 }
    return (order[a.category] ?? 9) - (order[b.category] ?? 9) || a.label.localeCompare(b.label)
  }),
)

const rulesByCategory = computed(() => {
  const groups = []
  const byKey = new Map()
  for (const rule of sortedRules.value) {
    const category = rule.category || 'other'
    if (!byKey.has(category)) {
      const group = {
        category,
        label: RULE_CATEGORY_LABELS[category] ?? category,
        rules: [],
      }
      byKey.set(category, group)
      groups.push(group)
    }
    byKey.get(category).rules.push(rule)
  }
  return groups
})

const enabledRuleCount = computed(
  () => Object.values(editRules.value ?? {}).filter((value) => value === true).length,
)
</script>

<template>
  <section class="rules" aria-labelledby="rules-heading">
    <div class="section__head">
      <div>
        <h2 id="rules-heading">Rules</h2>
        <p class="section-lede">{{ enabledRuleCount }} enabled · hover a rule for details</p>
      </div>
      <div class="section__head-actions">
        <Button
          label="Standard"
          severity="secondary"
          outlined
          data-test="run-preset-standard"
          @click="emit('preset', 'standard')"
        />
        <Button
          label="Hardcore"
          severity="secondary"
          outlined
          data-test="run-preset-hardcore"
          @click="emit('preset', 'hardcore')"
        />
        <Button
          label="Save"
          data-test="run-button-save-rules"
          :loading="saving"
          @click="emit('save')"
        />
      </div>
    </div>

    <div class="rules-compact surface" data-test="run-detail-rules-edit">
      <div v-for="group in rulesByCategory" :key="group.category" class="rules-group">
        <h3 class="rules-group__title">{{ group.label }}</h3>
        <ul class="rule-chip-list">
          <li v-for="rule in group.rules" :key="rule.key">
            <label
              class="rule-chip"
              :class="{ 'rule-chip--on': editRules[rule.key] }"
              :title="rule.description"
            >
              <input
                v-model="editRules[rule.key]"
                type="checkbox"
                :data-test="`run-rule-${rule.key}`"
              />
              <span>{{ rule.label }}</span>
            </label>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.85rem;
}

.section__head h2 {
  margin: 0 0 0.2rem;
  font-size: 1.25rem;
}

.section-lede {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-muted);
}

.section__head-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.rules-compact {
  display: grid;
  gap: 1rem;
  padding: 1.1rem 1.15rem;
}

.rules-group__title {
  margin: 0 0 0.45rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.rule-chip-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.rule-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  font-size: 0.85rem;
  cursor: pointer;
  user-select: none;
  transition:
    background var(--motion-fast) var(--ease-out),
    border-color var(--motion-fast) var(--ease-out),
    color var(--motion-fast) var(--ease-out);
}

.rule-chip input {
  margin: 0;
}

.rule-chip--on {
  border-color: rgb(31 122 92 / 40%);
  background: var(--color-primary-soft);
  color: var(--color-primary-strong);
  font-weight: 600;
}
</style>
