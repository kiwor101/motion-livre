<script setup lang="ts">
import TimelineMarker from './TimelineMarker.vue'

defineProps<{
  manual: number[]
  beats: number[]
  headerWidth: number
  pixelsPerSecond: number
  timeLabel: (time: number) => string
}>()

defineEmits<{
  drag: [event: PointerEvent, kind: 'manual' | 'beat', index: number]
  menu: [event: MouseEvent, kind: 'manual' | 'beat', index: number]
}>()
</script>

<template>
  <div class="timeline-markers">
    <TimelineMarker
      v-for="(time, index) in manual"
      :key="`manual-${index}-${time}`"
      kind="manual"
      :index="index"
      :time="time"
      :left="headerWidth + time * pixelsPerSecond"
      :label="`Marcador manual · ${timeLabel(time)} · arraste ou botão direito`"
      @drag="(...args) => $emit('drag', ...args)"
      @menu="(...args) => $emit('menu', ...args)"
    />
    <TimelineMarker
      v-for="(time, index) in beats"
      :key="`beat-${index}-${time}`"
      kind="beat"
      :index="index"
      :time="time"
      :left="headerWidth + time * pixelsPerSecond"
      :label="`Beat sync · ${timeLabel(time)} · arraste ou botão direito`"
      @drag="(...args) => $emit('drag', ...args)"
      @menu="(...args) => $emit('menu', ...args)"
    />
  </div>
</template>

<style scoped>
.timeline-markers {
  display: contents;
}
</style>
