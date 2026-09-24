<script setup lang="ts">
defineProps<{label: string; inputId: string; accept: string; multiple?: boolean}>()
</script>

<template>
  <label class="upload">{{ label }}<input :id="inputId" type="file" :accept="accept" :multiple="multiple"></label>
</template>

<style scoped>
.upload { display:block; width:100%; margin:16px 0; padding:16px; border:1px dashed var(--panel-border); border-radius:5px; background:var(--background); color:var(--muted-foreground); font-size:11px; text-align:center; cursor:pointer; }
.upload:hover { border-color:var(--muted-foreground); background:var(--panel-accent); color:var(--panel-foreground); }
input { display: none; }
</style>
