<script setup lang="ts">
import AppIcon from '../base/AppIcon.vue'
import MediaList from './MediaList.vue'
import UploadField from '../base/UploadField.vue'
</script>

<template>
  <div id="panel-media" class="panel active">
    <header class="assets-heading"><h2>Assets</h2><div class="assets-actions"><button type="button" title="Exibição em grade"><AppIcon name="grid-view" :size="15" /></button><button type="button" title="Ordenar"><AppIcon name="sort" :size="15" /></button><UploadField label="Importar" input-id="mediaInput" accept="video/*,image/*,audio/*" multiple /></div></header>
    <MediaList />
  </div>
</template>

<style scoped>
.assets-heading{height:42px;margin:-18px -16px 10px;padding:0 8px 0 12px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}
.assets-heading h2{font-size:12px}.assets-actions{display:flex;align-items:center;gap:3px}.assets-actions button{width:28px;height:28px;padding:0;display:grid;place-items:center;border:0;border-radius:5px;background:transparent;color:var(--muted)}
.assets-actions :deep(label){width:auto;min-height:28px!important;margin:0!important;padding:0 10px!important;border:1px solid var(--line)!important;border-radius:5px!important;background:transparent!important;color:var(--text)!important;font-size:11px!important}
</style>
