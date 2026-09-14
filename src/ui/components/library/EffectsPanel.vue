<script setup lang="ts">
import EffectActions from './EffectActions.vue'
import EffectControls from './EffectControls.vue'
import EffectPresetGrid from './EffectPresetGrid.vue'
</script>

<template>
  <div id="panel-effects" class="panel">
    <h2>Efeitos</h2><p>Aplicados à camada selecionada.</p>
    <EffectPresetGrid />
    <hr>
    <EffectControls />
    <EffectActions />
  </div>
</template>
