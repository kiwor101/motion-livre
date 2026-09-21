<script setup lang="ts">
import ColorField from '../base/ColorField.vue'
import RangeField from '../base/RangeField.vue'
import SelectField from '../base/SelectField.vue'
import BaseButton from '../base/BaseButton.vue'

const blendOptions = [
  ['normal','Normal'],['multiply','Multiplicar'],['screen','Tela'],['overlay','Sobrepor'],['lighten','Clarear'],['darken','Escurecer'],
  ['color-dodge','Subexposição de cor'],['color-burn','Superexposição de cor'],['hard-light','Luz intensa'],['soft-light','Luz suave'],
  ['difference','Diferença'],['exclusion','Exclusão'],['hue','Matiz'],['saturation','Saturação'],['color','Cor'],['luminosity','Luminosidade'],
].map(([value,label])=>({value,label}))
const fontOptions = ['Segoe UI','Arial','Georgia','Impact','Courier New'].map(value=>({value,label:value}))
const maskOptions = [{value:'none',label:'Nenhuma'},{value:'inset',label:'Retangular'},{value:'circle',label:'Circular'},{value:'ellipse',label:'Elíptica'},{value:'polygon',label:'Polígono personalizado'}]
</script>

<template>
  <label class="text-content">Conteúdo<textarea id="propContent" rows="3"></textarea></label>
  <h3>Tipografia</h3>
  <SelectField label="Modo de mesclagem" input-id="propBlend" :options="blendOptions" />
  <RangeField label="Raio do canto" input-id="propRadius" output-id="outRadius" :min="0" :max="100" />
  <RangeField label="Contorno" input-id="propStroke" output-id="outStroke" :min="0" :max="20" />
  <ColorField label="Cor do contorno" input-id="propStrokeColor" value="#000000" />
  <SelectField label="Fonte" input-id="propFont" :options="fontOptions" />
  <RangeField label="Tamanho da fonte" input-id="propFontSize" output-id="outFontSize" :min="8" :max="180" />
  <SelectField label="Máscara" input-id="propMaskMode" :options="maskOptions" />
  <BaseButton id="editMaskPoints" class="wide">Editar máscara no palco</BaseButton>
  <BaseButton id="clearMaskPoints" class="wide">Limpar pontos da máscara</BaseButton>
  <input id="propMask" type="checkbox" hidden>
</template>

<style scoped>
.text-content{display:block}.text-content textarea{width:100%;margin-top:5px;padding:9px;border:1px solid var(--line);border-radius:7px;background:#242426;color:var(--text);resize:vertical}h3{margin:16px -14px 8px;padding:12px 14px 0;border-top:1px solid var(--line);font-size:11px}
</style>
