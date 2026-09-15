<script setup lang="ts">
import BaseButton from '../base/BaseButton.vue'
</script>

<template>
  <div class="project-actions">
    <BaseButton id="newProject" variant="ghost">Novo</BaseButton>
    <BaseButton id="saveProject" variant="ghost">Salvar projeto</BaseButton>
    <BaseButton id="projectFile" variant="ghost">Projeto ▾</BaseButton>
  </div>
</template>

<style scoped>
.project-actions {
  display: contents;
}
</style>
