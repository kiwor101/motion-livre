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

interface SnapCandidate { time: number; radius: number }

export function snapTimelineTime(options: SnapOptions): number {
  const { state, time, pixelsPerSecond } = options
  // A playhead needs room between dense beat markers; clip edges keep the wider attraction.
  const markerRadius = (options.markersOnly ? 6 : 18) / Math.max(.001, pixelsPerSecond)
  const edgeRadius = 10 / Math.max(.001, pixelsPerSecond)
  const candidates: SnapCandidate[] = [
    ...state.markers.map(value => ({ time: value, radius: markerRadius })),
    ...state.beatMarkers.map(value => ({ time: value, radius: markerRadius })),
  ]
  if (!options.markersOnly) {
    candidates.push({ time: 0, radius: edgeRadius }, { time: state.playback.time, radius: edgeRadius }, { time: state.duration, radius: edgeRadius })
    for (const layer of state.layers) {
      if (layer.id !== undefined && options.exclude?.has(layer.id)) continue
      candidates.push(...([layer.start, layer.end] as const).map(value => ({ time: value, radius: edgeRadius })))
    }
  }
  let result = time
  let bestDistance = Infinity
  for (const candidate of candidates) {
    for (const offset of options.offsets ?? [0]) {
      const distance = Math.abs(time + offset - candidate.time)
      if (distance <= candidate.radius && distance < bestDistance) {
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
