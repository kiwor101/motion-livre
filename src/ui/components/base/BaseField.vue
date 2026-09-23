<script setup lang="ts">
defineProps<{label: string; labelAfter?: boolean}>()
</script>

<template>
  <label>
    <template v-if="!labelAfter">{{ label }}</template>
    <slot name="aside" />
    <slot />
    <template v-if="labelAfter"> {{ label }}</template>
  </label>
</template>

<style scoped>
label {
  display: block;
  margin: 10px 0;
  color: var(--muted-foreground);
  font-size: 12px;
  font-weight: 500;
}
</style>
