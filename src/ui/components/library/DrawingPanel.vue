<script setup lang="ts">
import BaseButton from '../base/BaseButton.vue'
</script>

<template>
  <div id="panel-draw" class="panel">
    <h2>Desenho vetorial</h2><p>Crie traços livres sobre a composição.</p>
    <label>Cor do pincel<input id="brushColor" type="color" value="#ffffff"></label>
    <label>Espessura<input id="brushSize" type="range" min="1" max="40" value="7"></label>
    <BaseButton id="startDrawing" class="wide">Iniciar desenho</BaseButton>
    <BaseButton id="clearDrawing" class="wide danger" variant="danger">Limpar desenho selecionado</BaseButton>
  </div>
</template>
