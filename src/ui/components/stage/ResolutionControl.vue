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

<style scoped>
#resolutionButton { position: absolute; left: 50%; min-width: 126px; color: var(--text); background: var(--panel2); border: 1px solid var(--line); transform: translateX(-50%); }
#resolutionMenu { position: absolute; left: 50%; top: calc(100% + 8px); z-index: 301; width: 310px; padding: 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--panel); box-shadow: 0 14px 36px #0008; transform: translateX(-50%); }
</style>
