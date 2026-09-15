<script setup lang="ts">
import MediaList from './MediaList.vue'
import UploadField from '../base/UploadField.vue'
</script>

<template>
  <div id="panel-media" class="panel active">
    <h2>Mídia</h2><p>Importe vídeos, imagens e áudios no mesmo lugar.</p>
    <UploadField label="+ Importar mídias" input-id="mediaInput" accept="video/*,image/*,audio/*" multiple />
    <MediaList />
  </div>
</template>
