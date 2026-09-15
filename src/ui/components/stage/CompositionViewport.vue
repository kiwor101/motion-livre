<script setup lang="ts">
import AlignmentGuides from './AlignmentGuides.vue'
import StageVectorOverlays from './StageVectorOverlays.vue'
</script>

<template>
  <div class="stage-wrap">
    <div id="stage" class="stage">
      <div class="stage-hint">Importe uma mídia ou adicione texto</div>
      <AlignmentGuides />
      <StageVectorOverlays />
    </div>
  </div>
</template>

<style scoped>
.stage-wrap {
  z-index: 0;
  display: grid;
  place-items: center;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  background-image: radial-gradient(circle, var(--line) 1px, transparent 1px);
  background-size: 12px 12px;
}

.stage {
  position: relative;
  flex: none;
  max-width: 100%;
  max-height: 100%;
  overflow: hidden;
  border: 0;
  border-radius: 0;
  background: #08090b;
  box-shadow: none;
}

.stage-hint {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--muted);
  font-size: 11px;
}
</style>
