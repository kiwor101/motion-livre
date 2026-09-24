<script setup lang="ts">
import BaseField from './BaseField.vue'

defineProps<{ label: string; inputId: string; checked?: boolean }>()
</script>

<template>
  <BaseField :label="label" label-after><input :id="inputId" type="checkbox" :checked="checked"></BaseField>
</template>

<style scoped>
input { display:inline-grid; width:16px; height:16px; margin:0 7px 0 0; appearance:none; place-content:center; border:1px solid var(--panel-border); border-radius:4px; background:var(--background); vertical-align:-3px; }
input::before { content:''; width:8px; height:8px; border-radius:2px; background:var(--primary-foreground); transform:scale(0); transition:transform .1s ease; }
input:checked { border-color:var(--primary); background:var(--primary); }
input:checked::before { transform:scale(1); }
</style>
