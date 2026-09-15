<script setup lang="ts">
import CustomResolutionForm from './CustomResolutionForm.vue'
import ResolutionPresets from './ResolutionPresets.vue'
</script>

<template>
  <button id="resolutionButton" type="button" aria-expanded="false">1920 × 1080</button>
  <div id="resolutionMenu" hidden>
    <ResolutionPresets />
    <CustomResolutionForm />
  </div>
</template>
