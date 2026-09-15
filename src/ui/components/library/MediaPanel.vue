<script setup lang="ts">
import MediaList from './MediaList.vue'
</script>

<template>
  <div id="panel-media" class="panel active">
    <h2>Mídia</h2><p>Importe vídeos, imagens e áudios no mesmo lugar.</p>
    <label class="upload">+ Importar mídias<input id="mediaInput" type="file" accept="video/*,image/*,audio/*" multiple></label>
    <MediaList />
  </div>
</template>
