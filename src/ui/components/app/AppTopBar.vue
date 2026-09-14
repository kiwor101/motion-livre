<script setup lang="ts">
import BrandIdentity from './BrandIdentity.vue'
import ProjectIdentity from './ProjectIdentity.vue'
import TopbarActions from './TopbarActions.vue'
import ToolSidebar from '../tools/ToolSidebar.vue'
</script>

<template>
  <header class="topbar">
    <BrandIdentity />
    <ProjectIdentity />
    <ToolSidebar />
    <TopbarActions />
  </header>
</template>
