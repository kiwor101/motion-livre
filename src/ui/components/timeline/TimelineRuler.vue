<script setup lang="ts">
import {computed} from 'vue'
import AppIcon from '../base/AppIcon.vue'
import TimelineMarkers from './TimelineMarkers.vue'
import TimelineRenderRange from './TimelineRenderRange.vue'

const props = defineProps<{
  duration: number
  headerWidth: number
  pixelsPerSecond: number
  manualMarkers: number[]
  beatMarkers: number[]
  rangeStart: number
  rangeEnd: number
  timeLabel: (time: number) => string
}>()

defineEmits<{
  dragMarker: [event: PointerEvent, kind: 'manual' | 'beat', index: number]
  menuMarker: [event: MouseEvent, kind: 'manual' | 'beat', index: number]
  dragRange: [event: PointerEvent, kind: 'start' | 'end']
}>()

const ticks = computed(() => Array.from({length: props.duration + 1}, (_, time) => ({
  time,
  major: time % 5 === 0,
  label: time === 0 ? '0s' : time % 60 === 0 ? `${time / 60}m` : String(time % 60).padStart(2, '0'),
})))
</script>

<template>
  <span
    v-for="tick in ticks"
    :key="tick.time"
    :class="tick.major ? 'major-tick' : 'minor-tick'"
    :data-second="tick.time"
    :style="{left: `${headerWidth + tick.time * pixelsPerSecond}px`}"
  >{{ tick.major ? tick.label : '' }}</span>
  <div class="ruler-corner" @pointerdown.stop>
    <AppIcon name="layers" class="ruler-icon" :size="15" />
    <span>Camadas</span>
  </div>
  <TimelineMarkers
    :manual="manualMarkers"
    :beats="beatMarkers"
    :header-width="headerWidth"
    :pixels-per-second="pixelsPerSecond"
    :time-label="timeLabel"
    @drag="(...args) => $emit('dragMarker', ...args)"
    @menu="(...args) => $emit('menuMarker', ...args)"
  />
  <TimelineRenderRange
    :start="rangeStart"
    :end="rangeEnd"
    :header-width="headerWidth"
    :pixels-per-second="pixelsPerSecond"
    :time-label="timeLabel"
    @drag="(...args) => $emit('dragRange', ...args)"
  />
</template>

<style scoped>
:global(.timeline .time-ruler) {
  position: sticky;
  top: 0;
  z-index: 15;
  height: 40px;
  border-bottom: 1px solid var(--line);
  background: var(--panel);
  box-shadow: 0 1px 0 var(--bg);
  cursor: ew-resize;
}

.ruler-corner {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  width: var(--timeline-header-width);
  height: 40px;
  padding: 0 16px;
  gap: 9px;
  border-right: 1px solid var(--line);
  background: var(--panel);
  color: var(--muted);
  font-size: 12px;
  pointer-events: auto;
  will-change: transform;
}

.ruler-icon {
  flex: 0 0 15px;
}

.ruler-corner span {
  position: static;
  height: auto;
  padding: 0;
  border: 0;
  color: inherit;
  font-size: inherit;
}

span[data-second] {
  position: absolute;
  top: 32px;
  height: 5px;
  padding: 0;
  border-left: 1px solid #4a4a4d;
  color: #747478;
  font-size: 9px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.major-tick {
  top: 0;
  width: 30px;
  height: 40px;
  padding: 6px 0 0;
  border-left: 0;
  color: #77777b;
  text-align: center;
  transform: translateX(-50%);
}

.major-tick::after {
  content: '';
  position: absolute;
  bottom: 3px;
  left: 50%;
  width: 1px;
  height: 8px;
  background: #5b5b5e;
}
</style>
