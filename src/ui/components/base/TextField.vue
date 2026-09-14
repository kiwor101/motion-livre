<script setup lang="ts">
defineProps<{ label: string; inputId: string }>()
</script>

<template>
  <label>{{ label }}<input :id="inputId" type="text"></label>
</template>

<style scoped>
label { display: block; margin: 10px 0; color: var(--muted); font-size: 12px; }
input { display: block; width: 100%; margin-top: 5px; }
</style>
