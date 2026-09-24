<script setup lang="ts">
import BaseButton from '../base/BaseButton.vue'
import EffectStack from './EffectStack.vue'
</script>

<template>
  <EffectStack />
  <BaseButton id="resetEffects" class="wide">Restaurar efeitos</BaseButton>
  <hr>
  <BaseButton id="saveEffectXml" class="wide">Salvar preset de efeitos XML</BaseButton>
  <BaseButton id="openEffectXml" class="wide">Importar preset XML</BaseButton>
</template>
