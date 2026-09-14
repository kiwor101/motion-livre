<script setup lang="ts">
import BaseButton from '../base/BaseButton.vue'
</script>

<template>
  <div id="effectStack" class="effect-stack"></div>
  <BaseButton id="resetEffects" class="wide">Restaurar efeitos</BaseButton>
  <hr>
  <BaseButton id="saveEffectXml" class="wide">Salvar preset de efeitos XML</BaseButton>
  <BaseButton id="openEffectXml" class="wide">Importar preset XML</BaseButton>
</template>
