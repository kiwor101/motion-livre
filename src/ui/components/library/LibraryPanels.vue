<script setup lang="ts">
import AnimationPanel from './AnimationPanel.vue'
import AudioPanel from './AudioPanel.vue'
import CutPanel from './CutPanel.vue'
import DrawingPanel from './DrawingPanel.vue'
import EffectsPanel from './EffectsPanel.vue'
import MediaPanel from './MediaPanel.vue'
import ProjectPanel from './ProjectPanel.vue'
import ShapePanel from './ShapePanel.vue'
import TextPanel from './TextPanel.vue'
</script>

<template>
  <section class="library">
    <MediaPanel />
    <TextPanel />
    <ShapePanel />
    <DrawingPanel />
    <EffectsPanel />
    <CutPanel />
    <AudioPanel />
    <AnimationPanel />
    <ProjectPanel />
  </section>
</template>
