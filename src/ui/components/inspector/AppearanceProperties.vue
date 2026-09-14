<script setup lang="ts">
import CheckboxField from '../base/CheckboxField.vue'
import ColorField from '../base/ColorField.vue'
import NumberField from '../base/NumberField.vue'
import RangeField from '../base/RangeField.vue'
import SelectField from '../base/SelectField.vue'

const fitOptions = [{value:'contain',label:'Ajustar inteira (sem corte)'},{value:'cover',label:'Preencher quadro (pode cortar)'},{value:'fill',label:'Esticar ao quadro'}]
const fillOptions = [{value:'solid',label:'Cor sólida'},{value:'linear',label:'Gradiente linear'},{value:'radial',label:'Gradiente radial'}]
</script>

<template>
  <RangeField label="Recorte horizontal" input-id="propCropX" output-id="outCropX" :min="0" :max="49" />
  <RangeField label="Recorte vertical" input-id="propCropY" output-id="outCropY" :min="0" :max="49" />
  <SelectField label="Ajuste da mídia" input-id="propFitMode" :options="fitOptions" />
  <CheckboxField label="Camada visível" input-id="propVisible" checked />
  <CheckboxField label="Bloquear edição" input-id="propLocked" />
  <CheckboxField label="Espelhar horizontalmente" input-id="propFlipX" />
  <CheckboxField label="Espelhar verticalmente" input-id="propFlipY" />
  <ColorField label="Cor" input-id="propColor" value="#ffffff" />
  <SelectField label="Preenchimento" input-id="propFillType" :options="fillOptions" />
  <ColorField label="Cor final do gradiente" input-id="propGradientColor" value="#7758ff" />
  <RangeField label="Ângulo do gradiente" input-id="propGradientAngle" output-id="outGradientAngle" :min="0" :max="360" />
  <NumberField label="Entrada na composição (s)" input-id="propStart" :min="0" :step="0.1" />
  <NumberField label="Saída na composição (s)" input-id="propEnd" :min="0" :step="0.1" />
</template>
