<script setup lang="ts">
import BaseButton from '../base/BaseButton.vue'
import ColorField from '../base/ColorField.vue'
import NumberField from '../base/NumberField.vue'
import SelectField from '../base/SelectField.vue'
import UploadField from '../base/UploadField.vue'

const fpsOptions = ['23.976', '24', '25', '29.97', '30', '50', '59.94', '60'].map(value => ({ value, label: value }))
</script>

<template>
  <div id="panel-project" class="panel">
    <h2>Composição</h2><p>Configurações do projeto e fundo.</p>
    <NumberField label="Largura" input-id="compWidth" :value="1920" :min="64" :max="7680" />
    <NumberField label="Altura" input-id="compHeight" :value="1080" :min="64" :max="7680" />
    <SelectField label="FPS" input-id="compFps" value="30" :options="fpsOptions" />
    <NumberField label="Duração (s)" input-id="compDuration" :value="10" :min="1" :max="600" />
    <ColorField label="Fundo" input-id="compBackground" value="#08090b" />
    <BaseButton id="applyComposition" class="wide">Aplicar composição</BaseButton>
    <hr><BaseButton id="exportProject" class="wide">Exportar projeto JSON</BaseButton>
    <UploadField label="Importar projeto JSON" input-id="importProject" accept="application/json,.json" />
    <hr><h3>Alight Motion XML</h3><p>Intercâmbio de cenas, camadas, keyframes e efeitos compatíveis.</p>
    <BaseButton id="exportAlightXml" class="wide">Exportar cena XML compatível</BaseButton>
    <UploadField label="Importar cena XML" input-id="importAlightXml" accept="application/xml,text/xml,.xml" />
  </div>
</template>
