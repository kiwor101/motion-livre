<script setup lang="ts">
import BaseButton from '../base/BaseButton.vue'
</script>

<template>
  <div class="history-actions">
    <BaseButton id="undoBtn" variant="ghost" title="Desfazer (Ctrl+Z)">↶</BaseButton>
    <BaseButton id="redoBtn" variant="ghost" title="Refazer (Ctrl+Y)">↷</BaseButton>
  </div>
</template>

<style scoped>
.history-actions {
  display: contents;
}
</style>
