import type { EditorState } from './editor-state'
import type { Layer } from './project-model'

interface SnapOptions {
  state: EditorState
  time: number
  pixelsPerSecond: number
  offsets?: number[]
  exclude?: Set<number>
  markersOnly?: boolean
}

export type TimelineSnapType='element-start'|'element-end'|'playhead'|'marker'|'beat'|'keyframe'
interface SnapCandidate { time: number; type: TimelineSnapType }

export function snapTimelineTime(options: SnapOptions): number {
  const { state, time, pixelsPerSecond } = options
  // OpenCut uses a screen-space threshold: magnetism feels identical at every zoom.
  const radius = 10 / Math.max(.001, pixelsPerSecond)
  const candidates: SnapCandidate[] = [
    ...state.markers.map(value => ({ time: value, type:'marker' as const })),
    ...state.beatMarkers.map(value => ({ time: value, type:'beat' as const })),
  ]
  if (!options.markersOnly) {
    candidates.unshift({ time: 0, type:'element-start' }, { time: state.duration, type:'element-end' }, { time: state.playback.time, type:'playhead' })
    for (const layer of state.layers) {
      if (layer.id !== undefined && options.exclude?.has(layer.id)) continue
      candidates.push({time:layer.start,type:'element-start'},{time:layer.end,type:'element-end'})
      for(const keyframe of layer.keyframes)candidates.push({time:keyframe.time,type:'keyframe'})
    }
  }
  let result = time
  let bestDistance = Infinity
  for (const candidate of candidates) {
    for (const offset of options.offsets ?? [0]) {
      const distance = Math.abs(time + offset - candidate.time)
      if (distance <= radius && distance < bestDistance) {
        bestDistance = distance
        result = candidate.time - offset
      }
    }
  }
  return result
}

export function layerIds(layers: Layer[]): Set<number> {
  return new Set(layers.flatMap(layer => layer.id === undefined ? [] : [layer.id]))
}
