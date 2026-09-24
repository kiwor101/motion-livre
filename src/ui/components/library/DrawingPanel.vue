<script setup lang="ts">
import BaseButton from '../base/BaseButton.vue'
import ColorField from '../base/ColorField.vue'
import RangeField from '../base/RangeField.vue'
</script>

<template>
  <div id="panel-draw" class="panel">
    <h2>Desenho vetorial</h2><p>Crie traços livres sobre a composição.</p>
    <ColorField label="Cor do pincel" input-id="brushColor" value="#ffffff" />
    <RangeField label="Espessura" input-id="brushSize" :min="1" :max="40" :value="7" />
    <BaseButton id="startDrawing" class="wide">Iniciar desenho</BaseButton>
    <BaseButton id="clearDrawing" class="wide danger" variant="danger">Limpar desenho selecionado</BaseButton>
  </div>
</template>
