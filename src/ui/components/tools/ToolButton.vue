<script setup lang="ts">
import AppIcon from '../base/AppIcon.vue'

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
    class="tool"
    :class="{ active }"
    :data-panel="panel"
    :data-material-icon="icon"
    :data-tooltip="label"
    :aria-label="label"
    @click="emit('select', panel)"
  >
    <AppIcon :name="icon" :size="18" :filled="active" />
    <span class="tool-label">{{ label }}</span>
  </button>
</template>

<style scoped>
.tool {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 34px;
  min-width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--muted);
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
}

.tool:hover {
  /* The global legacy button state still uses !important until all buttons migrate. */
  border-color: var(--line) !important;
  background: var(--panel2) !important;
  color: var(--text);
}

.tool:active {
  background: var(--panel2) !important;
  transform: translateY(1px);
}

.tool:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

.tool.active {
  border-color: transparent !important;
  background: color-mix(in srgb, var(--accent) 18%, transparent) !important;
  color: var(--accent);
}

.tool-label {
  display: none;
}

</style>
