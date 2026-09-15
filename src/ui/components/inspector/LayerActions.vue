<script setup lang="ts">
import BaseButton from '../base/BaseButton.vue'
</script>

<template>
  <BaseButton id="addKeyframe" class="wide">◆ Keyframe na posição atual</BaseButton>
  <BaseButton id="groupLayer" class="wide">Agrupar selecionada</BaseButton>
  <BaseButton id="moveLayerUp" class="wide">Mover para cima</BaseButton>
  <BaseButton id="moveLayerDown" class="wide">Mover para baixo</BaseButton>
  <BaseButton id="duplicateLayer" class="wide">Duplicar camada</BaseButton>
  <BaseButton id="deleteLayer" class="wide danger" variant="danger">Excluir camada</BaseButton>
</template>
