<script setup lang="ts">
defineProps<{
  label: string
  inputId: string
  value: string
}>()
</script>

<template>
  <label>{{ label }}<input :id="inputId" type="color" :value="value"></label>
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
</style>
