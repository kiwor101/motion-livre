<script setup lang="ts">
import BaseField from './BaseField.vue'

defineProps<{ label: string; inputId: string; min?: number; max?: number; step?: number; value?: number }>()
</script>

<template>
  <BaseField :label="label"><input :id="inputId" type="number" :min="min" :max="max" :step="step" :value="value"></BaseField>
</template>

<style scoped>
input { display: block; width: 100%; margin-top: 5px; padding: 8px; border: 1px solid var(--line); border-radius: 7px; background: var(--bg); color: var(--text); }
</style>
