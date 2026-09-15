<script setup lang="ts">
import RangeField from '../base/RangeField.vue'
import TextField from '../base/TextField.vue'

const fields = [
  ['Posição X', 'propX', 'outX', 0, 100], ['Posição Y', 'propY', 'outY', 0, 100],
  ['Escala', 'propScale', 'outScale', 10, 200], ['Rotação', 'propRotation', 'outRotation', -180, 180],
  ['Profundidade Z', 'propDepth', 'outDepth', -1000, 1000], ['Perspectiva da câmera', 'propPerspective', 'outPerspective', 300, 3000],
  ['Opacidade', 'propOpacity', 'outOpacity', 0, 100], ['Âncora X', 'propAnchorX', 'outAnchorX', 0, 100], ['Âncora Y', 'propAnchorY', 'outAnchorY', 0, 100],
] as const
</script>

<template>
  <TextField label="Nome" input-id="propName" />
  <RangeField v-for="field in fields" :key="field[1]" :label="field[0]" :input-id="field[1]" :output-id="field[2]" :min="field[3]" :max="field[4]" />
</template>
