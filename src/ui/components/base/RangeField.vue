<script setup lang="ts">
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
  <label>
    {{ label }}
    <output v-if="outputId" :id="outputId">{{ output }}</output>
    <input :id="inputId" type="range" :min="min" :max="max" :step="step" :value="value">
  </label>
</template>

<style scoped>
label {
  display: block;
  margin: 10px 0;
  color: var(--muted);
  font-size: 12px;
}

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
