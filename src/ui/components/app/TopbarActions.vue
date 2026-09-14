<script setup lang="ts">
import BaseButton from '../base/BaseButton.vue'
import HistoryActions from './HistoryActions.vue'
import ProjectActions from './ProjectActions.vue'
</script>

<template>
  <div class="top-actions">
    <HistoryActions />
    <ProjectActions />
    <BaseButton id="exportBtn" variant="primary">Exportar MP4</BaseButton>
  </div>
</template>
