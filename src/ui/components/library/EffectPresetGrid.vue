<script setup lang="ts">
const presets = [
  ['none', 'Original'], ['grayscale(1)', 'P&B'], ['sepia(.8)', 'Sépia'],
  ['blur(3px)', 'Desfoque'], ['contrast(1.5)', 'Contraste'], ['saturate(1.8)', 'Vibrante'],
  ['brightness(1.35)', 'Luz'], ['hue-rotate(90deg)', 'Matiz'], ['invert(1)', 'Inverter'],
  ['drop-shadow(8px 8px 8px #000)', 'Sombra'],
]
</script>

<template>
  <div class="effect-list">
    <button v-for="preset in presets" :key="preset[0]" type="button" :data-effect="preset[0]">{{ preset[1] }}</button>
  </div>
</template>
