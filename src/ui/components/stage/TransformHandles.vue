<script setup lang="ts">
defineEmits<{start: [event: PointerEvent, kind: 'scale' | 'rotate']}>()
</script>

<template>
  <i class="transform-handle scale" @pointerdown="$emit('start', $event, 'scale')" />
  <i class="transform-handle rotate" @pointerdown="$emit('start', $event, 'rotate')" />
</template>

<style scoped>
.transform-handle { position: absolute; z-index: 20; width: 14px; height: 14px; border: 2px solid white; background: var(--accent); border-radius: 50%; pointer-events: auto; }
.transform-handle.scale { right: -9px; bottom: -9px; cursor: nwse-resize; }
.transform-handle.rotate { left: 50%; top: -32px; transform: translateX(-50%); cursor: grab; }
.transform-handle.rotate::after { content: ''; position: absolute; left: 5px; top: 12px; width: 2px; height: 18px; background: white; }
</style>
