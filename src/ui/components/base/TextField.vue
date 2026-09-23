<script setup lang="ts">
import BaseField from './BaseField.vue'

defineProps<{ label: string; inputId: string; value?: string; maxLength?: number }>()
</script>

<template>
  <BaseField :label="label"><input :id="inputId" type="text" :value="value" :maxlength="maxLength"></BaseField>
</template>

<style scoped>
input { display:block; width:100%; height:28px; margin-top:6px; padding:0 9px; border:1px solid var(--panel-border); border-radius:5px; background:var(--panel-accent); color:var(--panel-foreground); box-shadow:0 1px 2px #0003; }
input:focus { border-color:var(--primary); outline:0; }
</style>
