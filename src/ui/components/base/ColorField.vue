<script setup lang="ts">
import BaseField from './BaseField.vue'

defineProps<{
  label: string
  inputId: string
  value: string
}>()
</script>

<template>
  <BaseField :label="label"><input :id="inputId" type="color" :value="value"></BaseField>
</template>

<style scoped>
input {
  display: block;
  width: 100%;
  height: 28px;
  margin-top: 6px;
  padding: 3px;
  border: 1px solid var(--panel-border);
  border-radius: 5px;
  background: var(--panel-accent);
}
</style>
