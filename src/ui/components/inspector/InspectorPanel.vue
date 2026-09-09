<script setup lang="ts">
import AppearanceProperties from './AppearanceProperties.vue'
import LayerActions from './LayerActions.vue'
import StyleProperties from './StyleProperties.vue'
import TransformProperties from './TransformProperties.vue'
</script>

<template>
  <aside class="inspector">
    <h2>Propriedades</h2>
    <div id="noSelection" class="empty">Selecione uma camada</div>
    <div id="properties" hidden>
      <TransformProperties />
      <AppearanceProperties />
      <StyleProperties />
      <LayerActions />
    </div>
  </aside>
</template>
