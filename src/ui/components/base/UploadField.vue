<script setup lang="ts">
defineProps<{label: string; inputId: string; accept: string; multiple?: boolean}>()
</script>

<template>
  <label class="upload">{{ label }}<input :id="inputId" type="file" :accept="accept" :multiple="multiple"></label>
</template>

<style scoped>
.upload { display: block; width: 100%; margin: 16px 0; padding: 16px; border: 1px dashed var(--line); border-radius: 10px; background: var(--bg); color: #aaa4af; font-size: 12px; text-align: center; cursor: pointer; }
input { display: none; }
</style>
