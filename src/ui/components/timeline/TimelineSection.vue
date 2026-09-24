<script setup lang="ts">
import TimelinePlayhead from './TimelinePlayhead.vue'
import TimelineToolbar from './TimelineToolbar.vue'
import TimelineGestureFeedback from './TimelineGestureFeedback.vue'
</script>

<template>
  <section class="timeline-section">
    <TimelineToolbar />
    <div class="timeline-head" aria-hidden="true"></div>
    <div id="timeline" class="timeline"><div class="timeline-empty">Adicione uma camada para começar</div><TimelinePlayhead /><TimelineGestureFeedback /></div>
  </section>
</template>

<style scoped>
.timeline-section {
  --timeline-header-width: 108px;
  height:100%;
  min-height:0;
  overflow:hidden;
  border:1px solid var(--panel-border);
  border-radius:6px;
  background:var(--panel-background);
}
.timeline-section :deep(.timeline), .timeline-head { background:var(--panel-background); }
.timeline-head { border-color:var(--panel-border); color:var(--muted-foreground); }
.timeline-section :deep(.time-ruler + .track) { margin-top:20px; }
</style>
