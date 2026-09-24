<script setup lang="ts">
import CompositionViewport from './CompositionViewport.vue'
import StageToolbar from './StageToolbar.vue'
import TransportControls from './TransportControls.vue'
</script>

<template>
  <section class="stage-area">
    <StageToolbar />
    <CompositionViewport />
    <TransportControls />
  </section>
</template>

<style scoped>
.stage-area {
  display: grid;
  grid-area: preview;
  grid-template-rows: 40px minmax(0, 1fr) 48px;
  min-width: 360px;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--panel-border);
  border-radius: 6px;
  background: var(--panel-background);
}

.stage-area:fullscreen {
  position: relative;
  display: block;
  width: 100vw;
  height: 100vh;
}

.stage-area:fullscreen :deep(.stage-wrap) {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

.stage-area:fullscreen :deep(.stage) {
  width: min(100vw, calc(100vh * var(--preview-ratio, 1.7777778))) !important;
  height: min(100vh, calc(100vw / var(--preview-ratio, 1.7777778))) !important;
  max-width: 100vw;
  max-height: 100vh;
}

.stage-area:fullscreen > :deep(.stage-toolbar),
.stage-area:fullscreen > :deep(.transport) {
  position: absolute;
  left: 50%;
  z-index: 100;
  width: min(900px, calc(100vw - 48px));
  border: 1px solid var(--line);
  border-radius: 10px;
  background: color-mix(in srgb, var(--panel) 78%, transparent);
  backdrop-filter: blur(12px);
  transform: translateX(-50%);
}

.stage-area:fullscreen > :deep(.stage-toolbar) { top: 18px; height: 48px; padding: 0 14px; }
.stage-area:fullscreen > :deep(.transport) { bottom: 18px; height: 58px; padding: 0 16px; }
.stage-area:fullscreen > :deep(.transport input) { flex: 1; max-width: none; }
</style>
