<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref} from 'vue'

type MarqueeDetail = {left: number; top: number; width: number; height: number} | null
const bounds = ref<MarqueeDetail>(null)
function update(event: Event) {
  bounds.value = (event as CustomEvent<MarqueeDetail>).detail
}
onMounted(() => window.addEventListener('motion:timeline-marquee', update))
onBeforeUnmount(() => window.removeEventListener('motion:timeline-marquee', update))
</script>

<template>
  <div v-if="bounds" class="selection-marquee" :style="{left: `${bounds.left}px`, top: `${bounds.top}px`, width: `${bounds.width}px`, height: `${bounds.height}px`}" />
</template>

<style scoped>
.selection-marquee { position: fixed; z-index: 1200; border: 1px solid #61e8f5; background: #22bad52b; pointer-events: none; }
</style>
