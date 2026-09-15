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
