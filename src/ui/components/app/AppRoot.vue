<script setup lang="ts">
import AppTopBar from './AppTopBar.vue'
import LibraryPanels from '../library/LibraryPanels.vue'
import StageArea from '../stage/StageArea.vue'
import InspectorPanel from '../inspector/InspectorPanel.vue'
import TimelineSection from '../timeline/TimelineSection.vue'
import AppOverlays from '../overlays/AppOverlays.vue'
</script>

<template>
  <AppTopBar />
  <Teleport to="#vueLibrary"><LibraryPanels /></Teleport>
  <Teleport to="#vueStage"><StageArea /></Teleport>
  <Teleport to="#vueInspector"><InspectorPanel /></Teleport>
  <Teleport to="#vueTimeline"><TimelineSection /></Teleport>
  <Teleport to="#vueOverlays"><AppOverlays /></Teleport>
</template>
