<script setup>
import PokemonSprite from '@/components/PokemonSprite.vue'

defineProps({
  options: { type: Array, required: true },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
})

const model = defineModel({ type: [Number, String, null], default: '' })
</script>

<template>
  <Select
    v-model="model"
    :options="options"
    option-label="name"
    option-value="id"
    filter
    show-clear
    filter-placeholder="Search species"
    placeholder="Select species"
    class="pokemon-picker"
    data-test="encounter-pokemon-select"
    :disabled="disabled"
    :required="required"
  >
    <template #value="{ value, placeholder }">
      <span v-if="value" class="pokemon-picker__value">
        <PokemonSprite :pokemon-id="value" size="sm" :name="options.find((p) => p.id === value)?.name" />
        {{ options.find((p) => p.id === value)?.name ?? `#${value}` }}
      </span>
      <span v-else>{{ placeholder }}</span>
    </template>
    <template #option="{ option }">
      <span class="pokemon-picker__option">
        <PokemonSprite :pokemon-id="option.id" :name="option.name" size="sm" />
        <span>#{{ option.id }} {{ option.name }}</span>
      </span>
    </template>
  </Select>
</template>

<style scoped>
.pokemon-picker {
  width: 100%;
}

.pokemon-picker__option,
.pokemon-picker__value {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
