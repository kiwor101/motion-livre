<script setup lang="ts">
import BaseButton from '../base/BaseButton.vue'
</script>

<template>
  <div id="panel-shape" class="panel">
    <h2>Formas</h2><p>Elementos vetoriais básicos.</p>
    <div class="shape-grid"><button type="button" data-shape="rect">▰ Retângulo</button><button type="button" data-shape="circle">● Círculo</button></div>
    <BaseButton id="startBezierPath" class="wide">Caneta Bézier</BaseButton>
  </div>
</template>

<style scoped>
.shape-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
.shape-grid button { display: block; width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--line); background: var(--panel2); color: var(--text); text-align: center; cursor: pointer; }
</style>
