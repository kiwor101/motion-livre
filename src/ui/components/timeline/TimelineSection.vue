<script setup lang="ts">
import TimelinePlayhead from './TimelinePlayhead.vue'
import TimelineToolbar from './TimelineToolbar.vue'
import TimelineGestureFeedback from './TimelineGestureFeedback.vue'
</script>

<template>
  <section class="timeline-section">
    <TimelineToolbar />
    <div class="timeline-head"><strong>Camadas</strong><span>0%</span><span>20%</span><span>40%</span><span>60%</span><span>80%</span><span>100%</span></div>
    <div id="timeline" class="timeline"><div class="timeline-empty">Adicione uma camada para começar</div><TimelinePlayhead /><TimelineGestureFeedback /></div>
  </section>
</template>

<style scoped>
.timeline-section {
  --timeline-header-width: 260px;
}
</style>
