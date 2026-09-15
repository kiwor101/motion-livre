<script setup lang="ts">
import BaseButton from '../base/BaseButton.vue'
</script>

<template>
  <div id="panel-project" class="panel">
    <h2>Composição</h2><p>Configurações do projeto e fundo.</p>
    <label>Largura<input id="compWidth" type="number" value="1920" min="64" max="7680"></label>
    <label>Altura<input id="compHeight" type="number" value="1080" min="64" max="7680"></label>
    <label>FPS<select id="compFps"><option>23.976</option><option>24</option><option>25</option><option>29.97</option><option selected>30</option><option>50</option><option>59.94</option><option>60</option></select></label>
    <label>Duração (s)<input id="compDuration" type="number" value="10" min="1" max="600"></label>
    <label>Fundo<input id="compBackground" type="color" value="#08090b"></label>
    <BaseButton id="applyComposition" class="wide">Aplicar composição</BaseButton>
    <hr><BaseButton id="exportProject" class="wide">Exportar projeto JSON</BaseButton>
    <label class="upload">Importar projeto JSON<input id="importProject" type="file" accept="application/json,.json"></label>
    <hr><h3>Alight Motion XML</h3><p>Intercâmbio de cenas, camadas, keyframes e efeitos compatíveis.</p>
    <BaseButton id="exportAlightXml" class="wide">Exportar cena XML compatível</BaseButton>
    <label class="upload">Importar cena XML<input id="importAlightXml" type="file" accept="application/xml,text/xml,.xml"></label>
  </div>
</template>
