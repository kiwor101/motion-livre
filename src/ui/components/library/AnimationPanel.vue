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
const keyframes = ref<Array<{time: number; properties: string}>>([])
type ParentOptionsDetail = {options: Array<{value: string; label: string}>; value: string}
function updateParents(event: Event) {
  const detail = (event as CustomEvent<ParentOptionsDetail>).detail
  parentOptions.value = detail.options
  parentValue.value = detail.value
}
function updateKeyframes(event: Event) {
  keyframes.value = (event as CustomEvent<Array<{time: number; properties: string}>>).detail
}
function seek(time: number) {
  window.dispatchEvent(new CustomEvent('motion:keyframe-seek', {detail: time}))
}
onMounted(() => { window.addEventListener('motion:parent-options', updateParents); window.addEventListener('motion:keyframes', updateKeyframes) })
onBeforeUnmount(() => { window.removeEventListener('motion:parent-options', updateParents); window.removeEventListener('motion:keyframes', updateKeyframes) })
</script>

<template>
  <div id="panel-animation" class="panel">
    <h2>Animação</h2><p>Keyframes, curvas e relações entre camadas.</p>
    <SelectField label="Propriedade" input-id="keyframeProperty" value="all" :options="properties" />
    <div class="keyframe-list" aria-live="polite">
      <strong>Keyframes da camada · {{ keyframes.length }}</strong>
      <p v-if="!keyframes.length">Nenhum keyframe nesta camada.</p>
      <button v-for="frame in keyframes" :key="frame.time" type="button" @click="seek(frame.time)">
        <span>{{ frame.time.toFixed(3) }}s</span><small>{{ frame.properties }}</small>
      </button>
    </div>
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
.keyframe-list { display: grid; gap: 5px; margin: 10px 0; padding: 9px; border: 1px solid var(--line); border-radius: 7px; background: #101219; }
.keyframe-list p { margin: 3px 0; color: var(--muted); font-size: 12px; }
.keyframe-list button { display: flex; justify-content: space-between; gap: 8px; padding: 6px 8px; border: 1px solid #6650c9; border-radius: 5px; background: #211b3b; color: #fff; cursor: pointer; }
.keyframe-list button:hover { border-color: #d8ccff; background: #35285d; }
.keyframe-list small { overflow: hidden; color: #cbbdf7; text-overflow: ellipsis; white-space: nowrap; }
</style>
