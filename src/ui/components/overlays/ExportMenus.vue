<script setup lang="ts">
import PopupMenu from '../base/PopupMenu.vue'
</script>

<template>
  <PopupMenu id="exportMenu" class="export-popup" hidden>
    <strong>Formato de saída</strong>
    <button type="button" data-export-format="mp4">MP4 · H.264 + AAC (recomendado)</button>
    <button type="button" data-export-format="mov">MOV · H.264 + AAC</button>
    <button type="button" data-export-format="webm">WebM / transparência</button>
    <button type="button" data-export-format="gif">GIF animado</button>
    <button type="button" data-export-format="png">PNG do frame atual</button>
    <button type="button" data-export-format="mp3">Somente áudio MP3</button>
  </PopupMenu>
</template>

<style scoped>
.export-popup {
  right: 18px;
}

.export-popup :deep(strong) {
  display: block;
  padding: 7px 9px;
  color: var(--muted);
  font-size: 11px;
}
</style>
