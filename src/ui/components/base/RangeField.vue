<script setup lang="ts">
import BaseField from './BaseField.vue'

withDefaults(defineProps<{
  label: string
  inputId: string
  outputId?: string
  min: number
  max: number
  step?: number
  value?: number
  output?: string
}>(), {
  step: 1,
  value: 0,
  output: '',
})
</script>

<template>
  <BaseField :label="label">
    <template #aside><output v-if="outputId" :id="outputId">{{ output }}</output></template>
    <input :id="inputId" type="range" :min="min" :max="max" :step="step" :value="value">
  </BaseField>
</template>

<style scoped>
input {
  display: block;
  width: 100%;
  margin-top: 5px;
}

output {
  float: right;
  color: var(--text);
}
</style>
