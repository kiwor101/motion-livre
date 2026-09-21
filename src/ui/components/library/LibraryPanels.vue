<script setup lang="ts">
import DrawingPanel from './DrawingPanel.vue'
import EffectsPanel from './EffectsPanel.vue'
import MediaPanel from './MediaPanel.vue'
import ProjectPanel from './ProjectPanel.vue'
import ShapePanel from './ShapePanel.vue'
import TextPanel from './TextPanel.vue'
import ToolSidebar from '../tools/ToolSidebar.vue'
</script>

<template>
  <section class="library">
    <ToolSidebar />
    <div class="library-content">
      <MediaPanel />
      <TextPanel />
      <ShapePanel />
      <DrawingPanel />
      <EffectsPanel />
      <ProjectPanel />
    </div>
  </section>
</template>

<style scoped>
.library :deep(.panel) { display: none; }
.library :deep(.panel.active) { display: block; }
.library :deep(.panel hr) { border: 0; border-top: 1px solid var(--line); margin: 18px 0; }
.library-content { min-width: 0; min-height: 0; padding: 18px 16px; overflow: auto; }
</style>
