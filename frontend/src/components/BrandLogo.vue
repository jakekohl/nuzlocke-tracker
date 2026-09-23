<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** Visual size of the mark */
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg', 'hero'].includes(value),
  },
  /** Icon mark vs full wordmark */
  variant: {
    type: String,
    default: 'icon',
    validator: (value) => ['icon', 'wordmark'].includes(value),
  },
  /** Hide decorative alt text when adjacent brand name is present */
  decorative: {
    type: Boolean,
    default: false,
  },
})

const src = computed(() =>
  props.variant === 'wordmark' ? '/brand-logo.svg' : '/brand-icon.svg',
)

const dimensions = computed(() =>
  props.variant === 'wordmark' ? { width: 900, height: 260 } : { width: 512, height: 512 },
)
</script>

<template>
  <img
    class="brand-logo"
    :class="[`brand-logo--${size}`, `brand-logo--${variant}`]"
    :src="src"
    :width="dimensions.width"
    :height="dimensions.height"
    :alt="decorative ? '' : 'Nuzlocke Tracker'"
    :aria-hidden="decorative ? 'true' : undefined"
    data-test="brand-logo"
  />
</template>

<style scoped>
.brand-logo {
  display: block;
  flex-shrink: 0;
  width: auto;
  height: auto;
  object-fit: contain;
}

.brand-logo--icon.brand-logo--sm {
  width: 1.85rem;
  height: 1.85rem;
}

.brand-logo--icon.brand-logo--md {
  width: 2.35rem;
  height: 2.35rem;
}

.brand-logo--icon.brand-logo--lg {
  width: 3.25rem;
  height: 3.25rem;
}

.brand-logo--icon.brand-logo--hero {
  width: clamp(4.5rem, 14vw, 6.5rem);
  height: clamp(4.5rem, 14vw, 6.5rem);
  filter: drop-shadow(0 8px 18px rgb(28 22 51 / 14%));
}

.brand-logo--wordmark.brand-logo--sm {
  width: auto;
  height: 1.5rem;
}

.brand-logo--wordmark.brand-logo--md {
  width: auto;
  height: 2rem;
}

.brand-logo--wordmark.brand-logo--lg {
  width: auto;
  height: 2.75rem;
}

.brand-logo--wordmark.brand-logo--hero {
  width: min(100%, 28rem);
  height: auto;
  filter: drop-shadow(0 8px 18px rgb(28 22 51 / 10%));
}
</style>
