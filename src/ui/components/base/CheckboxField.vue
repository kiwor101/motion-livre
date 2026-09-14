<script setup lang="ts">
defineProps<{ label: string; inputId: string; checked?: boolean }>()
</script>

<template>
  <label><input :id="inputId" type="checkbox" :checked="checked"> {{ label }}</label>
</template>

<style scoped>
label { display: block; margin: 10px 0; color: var(--muted); font-size: 12px; }
input { display: inline; width: auto; margin: 0; }
</style>
