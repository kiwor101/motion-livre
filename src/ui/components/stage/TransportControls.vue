<script setup lang="ts">
import BaseButton from '../base/BaseButton.vue'
import PreviewTools from './PreviewTools.vue'
</script>

<template>
  <div class="transport">
    <BaseButton id="toStart">|◀</BaseButton>
    <BaseButton id="playBtn" class="play">▶</BaseButton>
    <BaseButton id="toEnd">▶|</BaseButton>
    <span id="timeLabel">00:00.00 / 00:10.00</span>
    <input id="timeSlider" type="range" min="0" max="10" step="0.01" value="0" aria-label="Posição da reprodução">
    <BaseButton id="muteBtn">🔊</BaseButton>
    <PreviewTools />
  </div>
</template>

<style scoped>
.transport { position:static; z-index:1; display:flex; align-items:center; justify-content:flex-start; width:100%; height:48px; gap:7px; padding:0 12px; border:0; border-top:1px solid var(--panel-border); background:transparent; color:var(--panel-foreground); font-size:12px; }
.transport #timeLabel { order: 0; margin-right: 0; color: var(--muted); font-size: 12px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.transport input { flex: 1; min-width: 35px; max-width: 170px; height: 3px; }
.transport #muteBtn { margin-left: auto; }
.transport :deep(button) { width:32px; min-width:32px; height:32px; border-radius:5px; }
.transport :deep(.play.icon-button) { background:var(--foreground); color:var(--background); }

@media (max-width: 1150px) {
  .transport #timeLabel { display: none; }
  .transport input { max-width: 110px; }
}
</style>
