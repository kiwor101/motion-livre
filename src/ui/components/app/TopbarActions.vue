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

<style scoped>
.top-actions { display:flex; align-items:center; gap:8px; }
.top-actions :deep(button) { height:32px; padding:0 10px; border:1px solid transparent; border-radius:5px; background:transparent; color:var(--muted-foreground); font-size:11px; }
.top-actions :deep(button:hover) { background:var(--accent-bg); color:var(--foreground); }
.top-actions :deep(.base-button--primary) { padding-inline:14px; border-color:var(--primary); background:var(--primary); color:var(--primary-foreground); font-weight:600; }
@media (max-width:1100px) { .top-actions :deep(button:not(.base-button--primary)) { padding-inline:7px; } }
</style>
