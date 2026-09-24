<script setup lang="ts">
import BaseButton from '../base/BaseButton.vue'
</script>

<template>
  <div class="preview-tools">
    <BaseButton id="previewGrid" :aria-pressed="false">Guias</BaseButton>
    <select id="gridAspect" hidden aria-label="Proporção das guias">
      <option value="9/16">9:16</option>
      <option value="16/9">16:9</option>
      <option value="1/1">1:1</option>
      <option value="4/5">4:5</option>
      <option value="stage">Composição</option>
    </select>
    <BaseButton id="previewFullscreen" title="Preview em tela cheia">Tela cheia</BaseButton>
  </div>
</template>

<style scoped>
.preview-tools {
  position: static;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  margin-left: 0;
  transform: none;
}

.preview-tools select {
  max-width: 105px;
  font-size: 10px;
}
</style>
