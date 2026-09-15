<script setup lang="ts">
import CompatibilityReport from './CompatibilityReport.vue'
import ExportMenus from './ExportMenus.vue'
import ExportProgressModal from './ExportProgressModal.vue'
import ExportSettingsModal from './ExportSettingsModal.vue'
import FeatureModal from './FeatureModal.vue'
import MediaDropOverlay from './MediaDropOverlay.vue'
import ProjectMenu from './ProjectMenu.vue'
import ToastMessage from './ToastMessage.vue'
import TimelineContextMenu from './TimelineContextMenu.vue'
import StudioTooltip from './StudioTooltip.vue'
import TimelineMarquee from './TimelineMarquee.vue'
import BeatSyncPanel from '../timeline/BeatSyncPanel.vue'
</script>

<template>
  <MediaDropOverlay />
  <ToastMessage />
  <ProjectMenu />
  <ExportMenus />
  <ExportProgressModal />
  <ExportSettingsModal />
  <FeatureModal />
  <CompatibilityReport />
  <TimelineContextMenu />
  <StudioTooltip />
  <TimelineMarquee />
  <div class="beat-sync-host"><BeatSyncPanel /></div>
</template>
