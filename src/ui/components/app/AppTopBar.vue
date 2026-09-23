<script setup lang="ts">
import BrandIdentity from './BrandIdentity.vue'
import ProjectIdentity from './ProjectIdentity.vue'
import TopbarActions from './TopbarActions.vue'
</script>

<template>
  <header class="topbar">
    <BrandIdentity />
    <ProjectIdentity />
    <TopbarActions />
  </header>
</template>

<style scoped>
.topbar { height:54px; padding:2px 12px 0; display:flex; align-items:center; gap:4px; background:var(--background); }
</style>
