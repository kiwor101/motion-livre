<script setup lang="ts">
const presets = ['1920x1080', '1080x1920', '1080x1080', '1440x1440', '2160x2160']

const label = (value: string) => value.replace('x', ' × ')
</script>

<template>
  <div class="resolution-presets">
    <button
      v-for="preset in presets"
      :key="preset"
      type="button"
      :data-resolution="preset"
    >{{ label(preset) }}</button>
  </div>
</template>

<style scoped>
.resolution-presets { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.resolution-presets button { padding: 8px; border: 1px solid var(--line); border-radius: 7px; background: var(--panel2); color: var(--text); }
</style>
