<script setup lang="ts">
defineProps<{
  kind: 'manual' | 'beat'
  index: number
  time: number
  left: number
  label: string
}>()

defineEmits<{
  drag: [event: PointerEvent, kind: 'manual' | 'beat', index: number]
  menu: [event: MouseEvent, kind: 'manual' | 'beat', index: number]
}>()
</script>

<template>
  <i
    class="timeline-marker"
    :class="kind === 'beat' ? 'beat-marker' : 'manual-marker'"
    :data-marker-type="kind"
    :data-marker-index="index"
    :style="{ left: `${left}px` }"
    :title="label"
    @pointerdown="$emit('drag', $event, kind, index)"
    @contextmenu="$emit('menu', $event, kind, index)"
  />
</template>

<style scoped>
.timeline-marker {
  position: absolute;
  top: 9px;
  z-index: 9;
  width: 11px;
  height: 20px;
  margin-left: -5px;
  background: transparent;
  opacity: 1;
  cursor: ew-resize;
  pointer-events: auto;
  touch-action: none;
}

.timeline-marker::before {
  content: '';
  position: absolute;
  top: 0;
  left: 1px;
  width: 9px;
  height: 12px;
  background: #f2b94b;
  clip-path: polygon(0 0, 100% 0, 100% 72%, 50% 100%, 0 72%);
}

.beat-marker::before {
  top: 1px;
  left: 2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #28c7d8;
  box-shadow: 0 0 0 2px #123a3f;
}

.timeline-marker:hover {
  filter: drop-shadow(0 0 4px currentColor);
}

.timeline-marker:hover::before {
  filter: brightness(1.25);
}
</style>
