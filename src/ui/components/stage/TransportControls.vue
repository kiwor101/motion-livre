<script setup lang="ts">
import BaseButton from '../base/BaseButton.vue'
</script>

<template>
  <div class="transport">
    <BaseButton id="toStart">|◀</BaseButton>
    <BaseButton id="playBtn" class="play">▶</BaseButton>
    <span id="timeLabel">00:00.00 / 00:10.00</span>
    <input id="timeSlider" type="range" min="0" max="10" step="0.01" value="0" aria-label="Posição da reprodução">
    <BaseButton id="muteBtn">🔊</BaseButton>
  </div>
</template>
