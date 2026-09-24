<script setup lang="ts">
import BaseButton from '../base/BaseButton.vue'
import CheckboxField from '../base/CheckboxField.vue'
import NumberField from '../base/NumberField.vue'
import RangeField from '../base/RangeField.vue'
import SelectField from '../base/SelectField.vue'

const transitions = [
  {value: 'none', label: 'Nenhuma'},
  {value: 'fade', label: 'Fade'},
  {value: 'slide-left', label: 'Deslizar da esquerda'},
  {value: 'slide-right', label: 'Deslizar da direita'},
  {value: 'zoom', label: 'Zoom'},
]
const exitTransitions = transitions.map(option => option.value === 'slide-left'
  ? {...option, label: 'Deslizar à esquerda'}
  : option.value === 'slide-right' ? {...option, label: 'Deslizar à direita'} : option)
</script>

<template>
  <div id="panel-cut" class="panel">
    <h2>Corte e tempo</h2><p>Selecione um vídeo e posicione o cursor na linha do tempo.</p>
    <BaseButton id="setInPoint" class="wide">Definir entrada no cursor</BaseButton>
    <BaseButton id="setOutPoint" class="wide">Definir saída no cursor</BaseButton>
    <BaseButton id="splitAtPlayhead" class="wide">✂ Dividir no cursor</BaseButton>
    <BaseButton id="resetTrim" class="wide">Restaurar vídeo inteiro</BaseButton>
    <hr>
    <RangeField label="Velocidade" output-id="outSpeed" input-id="propSpeed" :min="0.5" :max="2" :step="0.05" :value="1" output="1.00×" />
    <RangeField label="Volume" output-id="outVolume" input-id="propVolume" :min="0" :max="200" :value="100" output="100%" />
    <NumberField label="Fade de entrada (s)" input-id="propFadeIn" :min="0" :max="30" :step="0.1" :value="0" />
    <NumberField label="Fade de saída (s)" input-id="propFadeOut" :min="0" :max="30" :step="0.1" :value="0" />
    <CheckboxField label="Silenciar esta camada" input-id="propMuted" />
    <CheckboxField label="Reproduzir ao contrário" input-id="propReverse" />
    <SelectField label="Transição de entrada" input-id="propTransitionIn" :options="transitions" />
    <SelectField label="Transição de saída" input-id="propTransitionOut" :options="exitTransitions" />
    <NumberField label="Duração da transição (s)" input-id="propTransitionDuration" :min="0.1" :max="10" :step="0.1" :value="0.5" />
  </div>
</template>
