export interface BeatEstimate {
  bpm: number
  sourceOffset: number
  confidence: number
}

interface BeatEstimateOptions {
  duration: number
  start?: number
  end?: number
  minBpm?: number
  maxBpm?: number
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value))

function sample(values: number[], position: number): number {
  const left = Math.floor(position)
  const mix = position - left
  return (values[left] ?? 0) * (1 - mix) + (values[left + 1] ?? 0) * mix
}

function onsetEnvelope(points: number[]): number[] {
  const smoothed = points.map((_, index) => {
    let total = 0
    let count = 0
    for (let offset = -2; offset <= 2; offset++) {
      const value = points[index + offset]
      if (Number.isFinite(value)) { total += Math.max(0, value); count++ }
    }
    return count ? total / count : 0
  })
  const novelty = smoothed.map((value, index) => Math.max(0, value - (smoothed[index - 2] ?? value)))
  const mean = novelty.reduce((sum, value) => sum + value, 0) / Math.max(1, novelty.length)
  return novelty.map(value => Math.max(0, value - mean * .35))
}

export function estimateBeatGrid(points: number[], options: BeatEstimateOptions): BeatEstimate | null {
  const duration = options.duration
  if (!Number.isFinite(duration) || duration <= 0 || points.length < 16) return null
  const start = clamp(options.start ?? 0, 0, duration)
  const end = clamp(options.end ?? duration, start, duration)
  if (end - start < .5) return null
  const rate = points.length / duration
  const first = Math.floor(start * rate)
  const last = Math.min(points.length, Math.ceil(end * rate))
  const envelope = onsetEnvelope(points.slice(first, last))
  const energy = envelope.reduce((sum, value) => sum + value * value, 0)
  if (energy <= 1e-10) return null

  const minBpm = clamp(options.minBpm ?? 60, 30, 300)
  const maxBpm = clamp(options.maxBpm ?? 200, minBpm, 300)
  let bestBpm = 120
  let bestScore = -Infinity
  let correlationTotal = 0
  for (let bpm = minBpm; bpm <= maxBpm + 1e-8; bpm += .25) {
    const lag = 60 / bpm * rate
    if (lag < 2 || lag >= envelope.length - 2) continue
    let correlation = 0
    let leftEnergy = 0
    let rightEnergy = 0
    for (let index = 0; index + lag < envelope.length; index++) {
      const left = envelope[index]
      const right = sample(envelope, index + lag)
      correlation += left * right
      leftEnergy += left * left
      rightEnergy += right * right
    }
    const normalized = correlation / Math.sqrt(Math.max(1e-12, leftEnergy * rightEnergy))
    const tempoPreference = Math.abs(Math.log2(bpm / 120)) * .025
    const score = normalized - tempoPreference
    correlationTotal += Math.max(0, normalized)
    if (score > bestScore) { bestScore = score; bestBpm = bpm }
  }
  if (!Number.isFinite(bestScore)) return null

  const intervalPoints = 60 / bestBpm * rate
  const phaseSteps = Math.max(1, Math.round(intervalPoints))
  let bestPhase = 0
  let bestPhaseScore = -Infinity
  for (let phase = 0; phase < phaseSteps; phase++) {
    let score = 0
    let beats = 0
    for (let position = phase; position < envelope.length; position += intervalPoints) {
      score += sample(envelope, position) + sample(envelope, position - 1) * .5 + sample(envelope, position + 1) * .5
      beats++
    }
    score /= Math.max(1, beats)
    if (score > bestPhaseScore) { bestPhaseScore = score; bestPhase = phase }
  }
  const sourceOffset = start + bestPhase / rate
  const confidence = clamp(bestScore * Math.min(1, correlationTotal / 8), 0, 1)
  return { bpm: +bestBpm.toFixed(2), sourceOffset: +sourceOffset.toFixed(4), confidence }
}
