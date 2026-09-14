<script setup lang="ts">
import CompatibilityReport from './CompatibilityReport.vue'
import ExportMenus from './ExportMenus.vue'
import ExportProgressModal from './ExportProgressModal.vue'
import ExportSettingsModal from './ExportSettingsModal.vue'
import FeatureModal from './FeatureModal.vue'
import MediaDropOverlay from './MediaDropOverlay.vue'
import ProjectMenu from './ProjectMenu.vue'
import ToastMessage from './ToastMessage.vue'
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
</template>
