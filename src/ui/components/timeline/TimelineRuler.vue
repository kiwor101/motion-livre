<script setup lang="ts">
import {computed} from 'vue'
import TimelineMarkers from './TimelineMarkers.vue'
import TimelineRenderRange from './TimelineRenderRange.vue'

const props = defineProps<{
  duration: number
  headerWidth: number
  pixelsPerSecond: number
  fps: number
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

const frameIntervals = [1, 2, 3, 5, 10, 15]
const labelFrameIntervals = [2, 3, 5, 10, 15]
const secondIntervals = [1, 2, 3, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600]
function optimal(minimum: number, frames: number[]) {
  const pixelsPerFrame = props.pixelsPerSecond / Math.max(1, props.fps)
  return frames.find(value => value * pixelsPerFrame >= minimum)! / props.fps || secondIntervals.find(value => value * props.pixelsPerSecond >= minimum) || 60
}
const labelEvery = computed(() => optimal(120, labelFrameIntervals))
const tickEvery = computed(() => {
  const raw = optimal(18, frameIntervals)
  const labelFrames = Math.round(labelEvery.value * props.fps)
  const candidates = frameIntervals.filter(value => labelFrames % value === 0 && value / props.fps * props.pixelsPerSecond >= 18)
  if (candidates.length) return candidates[0] / props.fps
  return Math.abs(labelEvery.value / raw - Math.round(labelEvery.value / raw)) < .0001 ? raw : labelEvery.value
})
const ticks = computed(() => Array.from({length: Math.floor(props.duration / tickEvery.value) + 1}, (_, index) => {
  const time = index * tickEvery.value
  const major = Math.abs(time / labelEvery.value - Math.round(time / labelEvery.value)) < .001
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  const frame = Math.round((time % 1) * props.fps)
  return {time, major, label: frame ? `${frame}f` : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
}))
</script>

<template>
  <span
    v-for="tick in ticks"
    :key="tick.time"
    :class="tick.major ? 'major-tick' : 'minor-tick'"
    :data-second="tick.time"
    :style="{left: `${headerWidth + tick.time * pixelsPerSecond}px`}"
  >{{ tick.major ? tick.label : '' }}</span>
  <div class="ruler-corner" aria-hidden="true" @pointerdown.stop></div>
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
  height: 22px;
  border-bottom: 1px solid var(--panel-border);
  background: #181818;
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
  height: 22px;
  padding: 0;
  border-right: 1px solid var(--panel-border);
  background: #181818;
  color: var(--muted);
  font-size: 12px;
  pointer-events: auto;
  will-change: transform;
}

span[data-second] {
  position: absolute;
  top: 6px;
  height: 6px;
  padding: 0;
  border-left: 1px solid color-mix(in srgb,var(--muted-foreground) 25%,transparent);
  color: color-mix(in srgb,var(--muted-foreground) 85%,transparent);
  font-size: 10px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.major-tick {
  top: 0;
  width: max-content;
  height: 22px;
  padding: 4px 0 0 0;
  border-left: 0;
  color: color-mix(in srgb,var(--muted-foreground) 85%,transparent);
}

.major-tick::after { display:none; }
</style>
