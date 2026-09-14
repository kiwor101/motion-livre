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
  margin-top: 5px;
}
</style>
