<script setup lang="ts">
import BaseButton from '../base/BaseButton.vue'
import BaseModal from '../base/BaseModal.vue'
</script>

<template>
  <BaseModal id="exportSettings" class="export-settings" title="Configurações de exportação" close-button-id="closeExportSettings" hidden>
    <div class="settings-grid">
        <label>Formato<input id="exportFormatLabel" readonly></label>
        <label>Preset<select id="exportPreset"><option value="source">Da composição</option><option value="720">HD 720p</option><option value="1080" selected>Full HD 1080p</option><option value="1440">QHD 1440p</option><option value="2160">4K UHD</option></select></label>
        <label>Largura<input id="exportWidth" type="number" min="64" max="7680" value="1920"></label>
        <label>Altura<input id="exportHeight" type="number" min="64" max="4320" value="1080"></label>
        <label>FPS<select id="exportFps"><option>23.976</option><option>24</option><option>25</option><option>29.97</option><option selected>30</option><option>50</option><option>59.94</option><option>60</option></select></label>
        <label>Qualidade<select id="exportQuality"><option value="16">Máxima</option><option value="18" selected>Alta</option><option value="23">Equilibrada</option><option value="28">Compacta</option></select></label>
        <label>Bitrate de áudio<select id="exportAudioBitrate"><option value="128k">128 kbps</option><option value="192k" selected>192 kbps</option><option value="320k">320 kbps</option></select></label>
        <label>Início (s)<input id="exportStart" type="number" min="0" step="0.01" value="0"></label>
        <label>Fim (s)<input id="exportEnd" type="number" min="0" step="0.01" value="10"></label>
        <label><input id="exportTransparent" type="checkbox"> Fundo transparente (WebM/PNG)</label>
    </div>
    <BaseButton id="startConfiguredExport" class="wide primary" variant="primary">Iniciar exportação</BaseButton>
  </BaseModal>
</template>

<style scoped>
.export-settings {
  --modal-max-width: 620px;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.settings-grid label {
  color: var(--muted);
  font-size: 12px;
}

.settings-grid input,
.settings-grid select {
  width: 100%;
  margin-top: 4px;
  padding: 8px;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: #101219;
  color: var(--text);
}

.settings-grid input[type='checkbox'] {
  width: auto;
}

@media (max-width: 1000px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>
