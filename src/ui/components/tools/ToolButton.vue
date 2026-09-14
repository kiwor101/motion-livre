<script setup lang="ts">
defineProps<{
  panel: string
  icon: string
  label: string
  active?: boolean
}>()
const emit = defineEmits<{ select: [panel: string] }>()
</script>

<template>
  <button
    type="button"
    class="tool icon-button"
    :class="{ active }"
    :data-panel="panel"
    :data-material-icon="icon"
    :data-tooltip="label"
    :aria-label="label"
    @click="emit('select', panel)"
  >
    <span class="tool-label">{{ label }}</span>
  </button>
</template>
