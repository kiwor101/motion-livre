<script setup lang="ts">
defineProps<{id: number; kind: string; content: string; selected: boolean}>()
defineEmits<{drag: [event: PointerEvent]; select: [event: MouseEvent]}>()
</script>

<template>
  <div class="layer" :class="[kind, {'shape circle': kind === 'circle', shape: kind === 'rect', 'media-layer': kind === 'image' || kind === 'video', selected}]" :data-id="id" :data-layer-type="kind" @pointerdown="$emit('drag', $event)" @click="$emit('select', $event)">{{ kind === 'text' ? content : '' }}</div>
</template>

<style scoped>
.layer { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); user-select: none; cursor: move; transform-origin: center; }
.layer.selected { outline: 2px solid var(--accent); outline-offset: 4px; }
.layer :deep(img), .layer :deep(video) { display: block; max-width: 520px; max-height: 320px; pointer-events: none; }
.layer.text { font-size: 42px; font-weight: 700; white-space: nowrap; }
.layer.shape { width: 160px; height: 100px; background: #7758ff; }
.layer.circle { width: 120px; height: 120px; border-radius: 50%; }
</style>
