<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref} from 'vue'

type Guide = {left: number; label: string} | null
type Drop = {left: number; top: number; height: number; newTrack: boolean; invalid: boolean; label: string} | null
const guide = ref<Guide>(null)
const drop = ref<Drop>(null)
function updateGuide(event: Event) { guide.value = (event as CustomEvent<Guide>).detail }
function updateDrop(event: Event) { drop.value = (event as CustomEvent<Drop>).detail }
onMounted(() => {
  window.addEventListener('motion:timeline-guide', updateGuide)
  window.addEventListener('motion:timeline-drop', updateDrop)
})
onBeforeUnmount(() => {
  window.removeEventListener('motion:timeline-guide', updateGuide)
  window.removeEventListener('motion:timeline-drop', updateDrop)
})
</script>

<template>
  <div v-if="guide" class="drop-guide" :style="{left: `${guide.left}px`}">{{ guide.label }}</div>
  <div v-if="drop" class="track-drop-indicator" :class="{'new-track': drop.newTrack, invalid: drop.invalid}" :style="{left: `${drop.left}px`, top: `${drop.top}px`, height: `${drop.height}px`}">{{ drop.label }}</div>
</template>

<style scoped>
.drop-guide { position: absolute; top: 21px; bottom: 0; border-left: 1px dashed #12e3de; z-index: 9; color: #12e3de; font-size: 11px; pointer-events: none; white-space: nowrap; padding-left: 5px; }
.track-drop-indicator { position: absolute; right: 8px; z-index: 10; border: 1px dashed #16d6d1; background: #12d6d11c; color: #86fff8; font-size: 10px; font-weight: 600; pointer-events: none; padding: 5px 8px; box-sizing: border-box; transition: top .12s ease, height .12s ease, background-color .12s ease; white-space: nowrap; }
.track-drop-indicator.new-track { padding: 0; border-style: solid; background: #16d6d1; box-shadow: 0 0 12px #16d6d180; color: transparent; }
.track-drop-indicator.invalid { border-color: #ff617d; background: #ff617d22; color: #ff8da1; }
</style>
