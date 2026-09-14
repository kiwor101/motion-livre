<script setup lang="ts">
defineProps<{
  panel: string
  icon: string
  label: string
  active?: boolean
}>()
</script>

<template>
  <button
    type="button"
    class="tool"
    :class="{ active }"
    :data-panel="panel"
  >
    <span aria-hidden="true">{{ icon }}</span>
    {{ label }}
  </button>
</template>
