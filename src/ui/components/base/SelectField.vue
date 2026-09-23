<script setup lang="ts">
import BaseField from './BaseField.vue'

defineProps<{
  label: string
  inputId: string
  value?: string
  options: Array<{ value: string; label: string }>
}>()
</script>

<template>
  <BaseField :label="label">
    <select :id="inputId" :value="value">
      <option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option>
    </select>
  </BaseField>
</template>

<style scoped>
select { display:block; width:100%; height:28px; margin-top:6px; padding:0 9px; border:1px solid var(--panel-border); border-radius:5px; background:var(--panel-accent); color:var(--panel-foreground); box-shadow:0 1px 2px #0003; }
select:focus { border-color:var(--primary); outline:0; }
</style>
