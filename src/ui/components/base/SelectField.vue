<script setup lang="ts">
import BaseField from './BaseField.vue'

defineProps<{
  label: string
  inputId: string
  options: Array<{ value: string; label: string }>
}>()
</script>

<template>
  <BaseField :label="label">
    <select :id="inputId">
      <option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option>
    </select>
  </BaseField>
</template>

<style scoped>
select { display: block; width: 100%; margin-top: 5px; padding: 8px; border: 1px solid var(--line); border-radius: 7px; background: var(--bg); color: var(--text); }
</style>
