<script setup>
import { computed, ref } from 'vue'
import { pokemonInitials, spriteUrl } from '@/lib/sprites'

const props = defineProps({
  pokemonId: { type: [Number, String], default: null },
  name: { type: String, default: '' },
  shiny: { type: Boolean, default: false },
  size: { type: String, default: 'md' },
})

const failed = ref(false)

const src = computed(() => spriteUrl(props.pokemonId, { shiny: props.shiny }))
const showImage = computed(() => Boolean(src.value) && !failed.value)
const initials = computed(() => pokemonInitials(props.name))
</script>

<template>
  <span class="sprite" :class="`sprite--${size}`" data-test="pokemon-sprite">
    <img
      v-if="showImage"
      :src="src"
      :alt="name ? `${name} sprite` : 'Pokémon sprite'"
      loading="lazy"
      @error="failed = true"
    />
    <span v-else class="sprite__fallback" aria-hidden="true">{{ initials }}</span>
  </span>
</template>

<style scoped>
.sprite {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #f4f6fb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.sprite--sm {
  width: 2.25rem;
  height: 2.25rem;
}

.sprite--md {
  width: 3.5rem;
  height: 3.5rem;
}

.sprite--lg {
  width: 5.75rem;
  height: 5.75rem;
}

.sprite img {
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  object-fit: contain;
}

.sprite__fallback {
  font-size: 0.7rem;
  font-weight: 700;
  color: #5c6bc0;
}
</style>
