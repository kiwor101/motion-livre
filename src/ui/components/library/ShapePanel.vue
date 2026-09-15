<script setup lang="ts">
import BaseButton from '../base/BaseButton.vue'
</script>

<template>
  <div id="panel-shape" class="panel">
    <h2>Formas</h2><p>Elementos vetoriais básicos.</p>
    <div class="shape-grid"><button data-shape="rect">▰ Retângulo</button><button data-shape="circle">● Círculo</button></div>
    <BaseButton id="startBezierPath" class="wide">Caneta Bézier</BaseButton>
  </div>
</template>
