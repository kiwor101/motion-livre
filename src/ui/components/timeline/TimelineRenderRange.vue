<script setup lang="ts">
defineProps<{
  start: number
  end: number
  headerWidth: number
  pixelsPerSecond: number
  timeLabel: (time: number) => string
}>()

defineEmits<{
  drag: [event: PointerEvent, kind: 'start' | 'end']
}>()
</script>

<template>
  <i
    v-for="kind in (['start', 'end'] as const)"
    :key="kind"
    class="timeline-range-marker"
    :class="`range-${kind}`"
    :data-range-boundary="kind"
    :style="{left: `${headerWidth + (kind === 'start' ? start : end) * pixelsPerSecond}px`}"
    :title="`${kind === 'start' ? 'Início' : 'Fim'} da renderização · ${timeLabel(kind === 'start' ? start : end)} · arraste para mover`"
    @pointerdown="$emit('drag', $event, kind)"
  />
</template>

<style scoped>
.timeline-range-marker{position:absolute;top:7px;width:13px;height:15px;margin-left:-6px;z-index:10;cursor:ew-resize;touch-action:none}
.timeline-range-marker::before{content:'';position:absolute;left:1px;top:0;width:11px;height:12px;background:currentColor;clip-path:polygon(0 0,100% 0,50% 100%)}
.range-start{color:#69b9ff}.range-end{color:#ef7d68}.timeline-range-marker:hover{filter:brightness(1.25)}
</style>
