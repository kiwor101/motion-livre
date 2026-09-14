<script setup lang="ts">
import { computed } from 'vue'
import { resolveIcon } from './icons'

const props = withDefaults(defineProps<{
  name: string
  label?: string
  size?: number
  filled?: boolean
}>(), {
  label: '',
  size: 20,
  filled: false,
})

const glyph = computed(() => resolveIcon(props.name))
</script>

<template>
  <span
    class="app-icon"
    :class="{ 'app-icon--filled': filled }"
    :style="{ '--app-icon-size': `${size}px` }"
    :aria-hidden="label ? undefined : 'true'"
    :aria-label="label || undefined"
    :role="label ? 'img' : undefined"
  >{{ glyph }}</span>
</template>

<style scoped>
.app-icon {
  display: inline-block;
  flex: 0 0 auto;
  width: var(--app-icon-size);
  height: var(--app-icon-size);
  overflow: hidden;
  font-family: 'Material Symbols Rounded';
  font-size: var(--app-icon-size);
  font-style: normal;
  font-weight: 400;
  line-height: 1;
  font-feature-settings: 'liga';
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  text-rendering: optimizeLegibility;
}

.app-icon--filled {
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
</style>
