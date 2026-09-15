<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref} from 'vue'

type Point = [number, number]
const motion = ref<Point[] | null>(null)
const mask = ref<Point[] | null>(null)
function updateMotion(event: Event) { motion.value = (event as CustomEvent<Point[] | null>).detail }
function updateMask(event: Event) { mask.value = (event as CustomEvent<Point[] | null>).detail }
onMounted(() => {
  window.addEventListener('motion:stage-motion-path', updateMotion)
  window.addEventListener('motion:stage-mask-path', updateMask)
})
onBeforeUnmount(() => {
  window.removeEventListener('motion:stage-motion-path', updateMotion)
  window.removeEventListener('motion:stage-mask-path', updateMask)
})
const coordinates = (points: Point[]) => points.map(point => point.join(',')).join(' ')
</script>

<template>
  <svg v-if="motion" class="motion-path" viewBox="0 0 100 100">
    <polyline :points="coordinates(motion)" />
    <circle v-for="([x, y], index) in motion" :key="index" :cx="x" :cy="y" r="1.4" />
  </svg>
  <svg v-if="mask" class="mask-path" viewBox="0 0 100 100">
    <polygon :points="coordinates(mask)" />
    <circle v-for="([x, y], index) in mask" :key="index" :cx="x" :cy="y" r="1.2" />
  </svg>
</template>

<style scoped>
.motion-path, .mask-path { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.motion-path { z-index: 10; }
.motion-path polyline { fill: none; stroke: #ffd05b; stroke-width: 2; stroke-dasharray: 5 4; }
.motion-path circle { fill: #fff; stroke: #7758ff; stroke-width: 2; }
.mask-path { z-index: 12; }
.mask-path polygon { fill: #7758ff22; stroke: #ffdb66; stroke-width: .7; stroke-dasharray: 2 1; }
.mask-path circle { fill: #fff; stroke: #7758ff; stroke-width: .7; }
</style>
