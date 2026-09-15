<script setup lang="ts">
import BaseButton from '../base/BaseButton.vue'
import BaseModal from '../base/BaseModal.vue'
</script>

<template>
  <BaseModal id="exportProgress" class="export-progress" title="Renderizando" hidden>
    <p id="exportStatus">Preparando composição…</p>
    <progress id="exportBar" max="100" value="0"></progress>
    <BaseButton id="cancelExport" class="wide danger" variant="danger">Cancelar</BaseButton>
  </BaseModal>
</template>

<style scoped>
.export-progress {
  --modal-width: 420px;
}

progress {
  width: 100%;
  height: 18px;
  margin: 12px 0 18px;
  accent-color: var(--accent);
}
</style>
