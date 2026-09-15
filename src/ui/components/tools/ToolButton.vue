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
    <AppIcon :name="icon" :size="16" :filled="active" />
    <span class="tool-label">{{ label }}</span>
  </button>
</template>

<style scoped>
.tool {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  height: 38px;
  gap: 7px;
  padding: 0 10px;
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
  overflow: hidden;
  font-size: 10px;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1150px) {
  .tool {
    min-width: 52px;
    padding: 0 7px;
  }

  .tool-label {
    display: none;
  }
}
</style>
