import { moveClip } from './clip-commands';
import type { EditorState } from './editor-state';

type MarkerKind = 'manual' | 'beat';

function finiteNumber(
  value: unknown,
  min: number,
  max: number,
  label: string,
): asserts value is number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < min ||
    value > max
  ) {
    throw new RangeError(`${label} inválido`);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function markersFor(state: EditorState, kind: MarkerKind): number[] {
  if (kind === 'manual') return state.markers;
  if (kind === 'beat') return state.beatMarkers;
  throw new Error('Tipo de marcador inválido');
}

export function setMarkers(
  state: EditorState,
  { kind, markers }: { kind: MarkerKind; markers: number[] },
): boolean {
  const normalized = [
    ...new Set(
      markers.map((time) => {
        finiteNumber(time, 0, state.duration, 'Marcador');
        return +time.toFixed(4);
      }),
    ),
  ]
    .sort((a, b) => a - b)
    .slice(0, 10_000);

  if (kind === 'manual') state.markers = normalized;
  else if (kind === 'beat') state.beatMarkers = normalized;
  else throw new Error('Tipo de marcador inválido');

  return true;
}

export function addMarker(
  state: EditorState,
  { kind = 'manual', time }: { kind?: MarkerKind; time: number },
): boolean {
  const current = markersFor(state, kind);
  const before = current.length;

  setMarkers(state, { kind, markers: [...current, time] });

  return markersFor(state, kind).length > before;
}

export function moveMarker(
  state: EditorState,
  { kind, index, time }: { kind: MarkerKind; index: number; time: number },
): boolean {
  const current = markersFor(state, kind);
  if (!Number.isSafeInteger(index) || index < 0 || index >= current.length) {
    return false;
  }

  const next = [...current];
  next[index] = time;
  setMarkers(state, { kind, markers: next });
  return true;
}

export function removeMarker(
  state: EditorState,
  { kind, index }: { kind: MarkerKind; index: number },
): boolean {
  const current = markersFor(state, kind);
  if (!Number.isSafeInteger(index) || index < 0 || index >= current.length) {
    return false;
  }

  setMarkers(state, {
    kind,
    markers: current.filter((_, position) => position !== index),
  });
  return true;
}

export function setRange(
  state: EditorState,
  { edge, time }: { edge: 'start' | 'end'; time: number },
): boolean {
  if (edge !== 'start' && edge !== 'end') {
    throw new Error('Borda de intervalo inválida');
  }

  finiteNumber(time, 0, state.duration, 'Tempo');
  const range = { ...state.renderRange, [edge]: time };
  if (range.start >= range.end) return false;

  state.renderRange = range;
  return true;
}

export function setRenderRange(
  state: EditorState,
  { start, end }: { start: number; end: number },
): boolean {
  finiteNumber(start, 0, state.duration, 'Início do intervalo');
  finiteNumber(end, 0, state.duration, 'Fim do intervalo');
  if (start >= end) return false;

  state.renderRange = { start, end };
  return true;
}

export function extendDurationTo(
  state: EditorState,
  { end }: { end: number },
): boolean {
  finiteNumber(end, 0, 3600, 'Fim da camada');
  if (end <= state.duration) return false;

  state.duration = end;
  return true;
}

export function generateBeats(
  state: EditorState,
  { bpm, offset }: { bpm: number; offset: number },
): boolean {
  finiteNumber(bpm, 30, 300, 'BPM');
  finiteNumber(offset, 0, state.duration, 'Início');

  const markers: number[] = [];
  const interval = 60 / bpm;
  for (
    let time = offset;
    time <= state.duration + 0.0001 && markers.length < 5000;
    time += interval
  ) {
    markers.push(+time.toFixed(4));
  }

  state.beatSync = { bpm, offset };
  state.beatMarkers = markers;
  return true;
}

export function trimEmpty(
  state: EditorState,
  { edge }: { edge: 'start' | 'end' },
): boolean {
  if (edge !== 'start' && edge !== 'end') {
    throw new Error('Borda de timeline inválida');
  }
  if (!state.layers.length) return false;

  const frame = 1 / (state.composition.fps || 30);
  const duration = state.duration;

  if (edge === 'start') {
    const gap = Math.min(...state.layers.map((layer) => layer.start));
    if (gap <= frame / 2) return false;

    for (const layer of state.layers) {
      Object.assign(layer, moveClip(layer, layer.start - gap, duration));
    }

    state.markers = state.markers.map((time) => time - gap).filter((time) => time >= 0);
    state.beatMarkers = state.beatMarkers
      .map((time) => time - gap)
      .filter((time) => time >= 0);
    state.duration = duration - gap;

    const rangeEnd = clamp(
      state.renderRange.end - gap,
      Math.min(frame, state.duration),
      state.duration,
    );
    state.renderRange = {
      start: clamp(state.renderRange.start - gap, 0, Math.max(0, rangeEnd - frame)),
      end: rangeEnd,
    };

    const interval = 60 / state.beatSync.bpm;
    // Mantém a fase dos beats equivalente depois de deslocar a timeline.
    const offset = ((state.beatSync.offset - gap) % interval + interval) % interval;
    state.beatSync = { ...state.beatSync, offset };
    state.playback.time = Math.max(0, state.playback.time - gap);
  } else {
    const end = Math.max(...state.layers.map((layer) => layer.end));
    if (duration - end <= frame / 2) return false;

    state.duration = Math.max(frame, end);
    state.markers = state.markers.filter((time) => time <= state.duration);
    state.beatMarkers = state.beatMarkers.filter((time) => time <= state.duration);

    const rangeEnd = Math.min(state.renderRange.end, state.duration);
    state.renderRange = {
      start: Math.min(state.renderRange.start, Math.max(0, rangeEnd - frame)),
      end: rangeEnd,
    };
    state.playback.time = Math.min(state.playback.time, state.duration);
  }

  return true;
}
