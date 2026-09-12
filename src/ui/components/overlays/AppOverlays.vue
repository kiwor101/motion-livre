<template>
  <div id="mediaDropOverlay" class="media-drop-overlay"><strong>Solte para importar ao projeto</strong><span>Vídeos, imagens e áudios serão adicionados como novas camadas</span></div>
  <div id="toast" class="toast"></div>
  <div id="projectMenu" class="popup" hidden><button id="menuExport">Exportar JSON</button><button id="menuImport">Importar JSON</button><button id="menuExportAlight">Exportar Alight XML</button><button id="menuImportAlight">Importar Alight XML</button><button id="menuFeatures">Mapa de recursos</button></div>
  <div id="exportMenu" class="popup export-popup" hidden><strong>Formato de saída</strong><button data-export-format="mp4">MP4 · H.264 + AAC (recomendado)</button><button data-export-format="mov">MOV · H.264 + AAC</button><button data-export-format="webm">WebM / transparência</button><button data-export-format="gif">GIF animado</button><button data-export-format="png">PNG do frame atual</button><button data-export-format="mp3">Somente áudio MP3</button></div>
  <div id="exportProgress" class="modal" hidden><div class="progress-card"><h2>Renderizando</h2><p id="exportStatus">Preparando composição…</p><progress id="exportBar" max="100" value="0"></progress><button id="cancelExport" class="wide danger">Cancelar</button></div></div>
  <div id="featureModal" class="modal" hidden><div class="modal-card"><button id="closeFeatures" class="modal-close">×</button><h2>Recursos do Motion Livre</h2><div id="featureGrid"></div></div></div>
  <div id="compatReport" class="modal" hidden><div class="modal-card"><button id="closeCompatReport" class="modal-close">×</button><h2>Relatório de compatibilidade XML</h2><div id="compatReportBody"></div><button id="acceptCompatReport" class="wide primary">Entendi</button></div></div>
  <div id="exportSettings" class="modal" hidden>
    <div class="modal-card export-settings-card">
      <button id="closeExportSettings" class="modal-close">×</button><h2>Configurações de exportação</h2>
      <div class="settings-grid">
        <label>Formato<input id="exportFormatLabel" readonly></label>
        <label>Preset<select id="exportPreset"><option value="source">Da composição</option><option value="720">HD 720p</option><option value="1080" selected>Full HD 1080p</option><option value="1440">QHD 1440p</option><option value="2160">4K UHD</option></select></label>
        <label>Largura<input id="exportWidth" type="number" min="64" max="7680" value="1920"></label>
        <label>Altura<input id="exportHeight" type="number" min="64" max="4320" value="1080"></label>
        <label>FPS<select id="exportFps"><option>24</option><option selected>30</option><option>60</option></select></label>
        <label>Qualidade<select id="exportQuality"><option value="16">Máxima</option><option value="18" selected>Alta</option><option value="23">Equilibrada</option><option value="28">Compacta</option></select></label>
        <label>Bitrate de áudio<select id="exportAudioBitrate"><option value="128k">128 kbps</option><option value="192k" selected>192 kbps</option><option value="320k">320 kbps</option></select></label>
        <label>Início (s)<input id="exportStart" type="number" min="0" step="0.01" value="0"></label>
        <label>Fim (s)<input id="exportEnd" type="number" min="0" step="0.01" value="10"></label>
        <label><input id="exportTransparent" type="checkbox"> Fundo transparente (WebM/PNG)</label>
      </div>
      <button id="startConfiguredExport" class="wide primary">Iniciar exportação</button>
    </div>
  </div>
</template>
