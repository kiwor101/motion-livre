const assert = require('node:assert/strict')
const { estimateBeatGrid } = require('../.build/core/beat-detection.js')
const { snapTimelineTime } = require('../.build/core/timeline-snap.js')
const Editor = require('../.build/core/editor-state.js')
const Project = require('../.build/core/project-model.js')

function pulseWaveform({ bpm, duration, phase, rate = 50 }) {
  const points = Array.from({ length: duration * rate }, () => .12)
  const interval = 60 / bpm
  for (let time = phase; time < duration; time += interval) {
    const index = Math.round(time * rate)
    for (let offset = 0; offset < 5; offset++) points[index + offset] = Math.max(points[index + offset] ?? 0, 1 - offset * .16)
  }
  return points
}

for (const expected of [96, 120, 150]) {
  const result = estimateBeatGrid(pulseWaveform({ bpm: expected, duration: 16, phase: .18 }), { duration: 16 })
  assert.ok(result, `No estimate for ${expected} BPM`)
  assert.ok(Math.abs(result.bpm - expected) <= .5, `${expected} BPM was estimated as ${result.bpm}`)
  const interval = 60 / expected
  const phaseError = Math.min(Math.abs(result.sourceOffset - .18), Math.abs(result.sourceOffset - .18 + interval), Math.abs(result.sourceOffset - .18 - interval))
  assert.ok(phaseError < .04, `${expected} BPM phase drifted by ${phaseError}s`)
}

const trimmed = estimateBeatGrid(pulseWaveform({ bpm: 120, duration: 20, phase: .2 }), { duration: 20, start: 5, end: 13 })
assert.ok(trimmed && Math.abs(trimmed.bpm - 120) <= .5, 'Trimmed source range changed the detected tempo')
assert.ok(trimmed.sourceOffset >= 5 && trimmed.sourceOffset <= 5.25, 'Trimmed source phase was not mapped to source time')
assert.equal(estimateBeatGrid(Array(500).fill(.2), { duration: 10 }), null, 'Flat audio produced a false beat')

const snapState = Editor.create({ duration: 12, markers: [3], beatMarkers: [6] })
snapState.layers = [
  Project.normalizeLayer({ id: 1, type: 'text', start: 1, end: 2 }, 12),
  Project.normalizeLayer({ id: 2, type: 'video', start: 7, end: 9 }, 12),
  Project.normalizeLayer({ id: 3, type: 'audio', start: 9.5, end: 11 }, 12),
]
assert.equal(snapTimelineTime({ state: snapState, time: 3.4, pixelsPerSecond: 40 }), 3, 'Manual marker did not use the larger magnetic radius')
assert.equal(snapTimelineTime({ state: snapState, time: 6.4, pixelsPerSecond: 40 }), 6, 'Beat marker did not use the larger magnetic radius')
assert.equal(snapTimelineTime({ state: snapState, time: 7.2, pixelsPerSecond: 40 }), 7, 'Video edge did not attract a clip')
assert.equal(snapTimelineTime({ state: snapState, time: 9.7, pixelsPerSecond: 40 }), 9.5, 'Audio edge did not attract a clip')
assert.equal(snapTimelineTime({ state: snapState, time: 1.2, pixelsPerSecond: 40, exclude: new Set([1]) }), 1.2, 'Moving clip snapped to its own edge')
assert.equal(snapTimelineTime({ state: snapState, time: 6.1, pixelsPerSecond: 40, markersOnly: true }), 6, 'Nearby beat marker did not attract the playhead')
assert.equal(snapTimelineTime({ state: snapState, time: 3.1, pixelsPerSecond: 40, markersOnly: true }), 3, 'Nearby manual marker did not attract the playhead')
assert.equal(snapTimelineTime({ state: snapState, time: 6.4, pixelsPerSecond: 40, markersOnly: true }), 6.4, 'Playhead magnetism blocked navigation between markers')

console.log('PASS: beat detection preserves tempo/phase and timeline snapping favors markers')
