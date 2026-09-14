<script setup lang="ts">
import BaseField from './BaseField.vue'

defineProps<{ label: string; inputId: string; checked?: boolean }>()
</script>

<template>
  <BaseField :label="label" label-after><input :id="inputId" type="checkbox" :checked="checked"></BaseField>
</template>

<style scoped>
input { display: inline; width: auto; margin: 0; }
</style>
