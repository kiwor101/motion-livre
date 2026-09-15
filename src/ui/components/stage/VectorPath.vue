<script setup lang="ts">
defineProps<{path: string; color: string; stroke: number}>()
</script>

<template>
  <svg viewBox="0 0 100 100" preserveAspectRatio="none">
    <path :d="path" fill="none" stroke-linecap="round" stroke-linejoin="round" :stroke="color" :stroke-width="stroke" />
  </svg>
</template>

<style scoped>
svg { width: 100%; height: 100%; overflow: visible; }
path { vector-effect: non-scaling-stroke; }
</style>
