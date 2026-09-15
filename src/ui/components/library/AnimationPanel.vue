<script setup lang="ts">
import BaseButton from '../base/BaseButton.vue'
import SelectField from '../base/SelectField.vue'
import {onBeforeUnmount, onMounted, ref} from 'vue'

const properties = [
  {value: 'all', label: 'Todas as transformações'},
  {value: 'x', label: 'Posição X'},
  {value: 'y', label: 'Posição Y'},
  {value: 'depth', label: 'Profundidade Z'},
  {value: 'scale', label: 'Escala'},
  {value: 'rotation', label: 'Rotação'},
  {value: 'opacity', label: 'Opacidade'},
]
const easings = [
  {value: 'linear', label: 'Linear'},
  {value: 'ease-in', label: 'Acelerar'},
  {value: 'ease-out', label: 'Desacelerar'},
  {value: 'ease-in-out', label: 'Suave'},
  {value: 'bounce', label: 'Rebote'},
]
const parentOptions = ref([{value: '', label: 'Nenhuma'}])
const parentValue = ref('')
type ParentOptionsDetail = {options: Array<{value: string; label: string}>; value: string}
function updateParents(event: Event) {
  const detail = (event as CustomEvent<ParentOptionsDetail>).detail
  parentOptions.value = detail.options
  parentValue.value = detail.value
}
onMounted(() => window.addEventListener('motion:parent-options', updateParents))
onBeforeUnmount(() => window.removeEventListener('motion:parent-options', updateParents))
</script>

<template>
  <div id="panel-animation" class="panel">
    <h2>Animação</h2><p>Keyframes, curvas e relações entre camadas.</p>
    <SelectField label="Propriedade" input-id="keyframeProperty" :options="properties" />
    <SelectField label="Interpolação" input-id="propEasing" :options="easings" />
    <canvas id="easingGraph" width="220" height="110"></canvas>
    <SelectField label="Camada pai" input-id="propParent" :value="parentValue" :options="parentOptions" />
    <BaseButton id="addNullLayer" class="wide">Adicionar objeto nulo</BaseButton>
    <BaseButton id="addCameraLayer" class="wide">Adicionar câmera 2.5D</BaseButton>
    <BaseButton id="precomposeLayers" class="wide">Precompor camadas marcadas</BaseButton>
    <BaseButton id="showMotionPath" class="wide">Exibir caminho de movimento</BaseButton>
  </div>
</template>

<style scoped>
#easingGraph { width: 100%; height: 110px; background: #101219; border: 1px solid var(--line); border-radius: 7px; }
</style>
