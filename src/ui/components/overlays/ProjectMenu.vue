<script setup lang="ts">
import PopupMenu from '../base/PopupMenu.vue'
</script>

<template>
  <PopupMenu id="projectMenu" hidden>
    <button id="menuExport" type="button">Salvar projeto como…</button>
    <button id="menuImport" type="button">Importar JSON</button>
    <button id="menuExportAlight" type="button">Exportar Alight XML</button>
    <button id="menuImportAlight" type="button">Importar Alight XML</button>
    <button id="menuFeatures" type="button">Mapa de recursos</button>
  </PopupMenu>
</template>
