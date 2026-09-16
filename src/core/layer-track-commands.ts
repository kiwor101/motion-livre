import type { EditorState, ProjectState } from './editor-state';
import type { Layer, LayerId, TrackId } from './project-model';

export interface TrackRow {
  id: TrackId;
  layers: Layer[];
}

export type ClipTrackPlacement =
  | { destinationTrackId: TrackId; newTrack?: never }
  | {
      destinationTrackId?: never;
      newTrack: {
        id: TrackId;
        name: string;
        targetTrackId: TrackId;
        before: boolean;
      };
    };

function validTrackId(value: TrackId): boolean {
  return typeof value === 'number'
    ? Number.isSafeInteger(value)
    : typeof value === 'string' && Boolean(value.trim());
}

export function trackIdFor(layer: Layer): TrackId | null {
  return layer.trackId ?? (layer.id === undefined ? null : `track-${layer.id}`);
}

export function trackRows(state: ProjectState): TrackRow[] {
  const rows: TrackRow[] = [];
  for (const layer of [...state.layers].reverse()) {
    const id = trackIdFor(layer);
    if (id === null) continue;
    let row = rows.find((item) => item.id === id);
    if (!row) {
      row = { id, layers: [] };
      rows.push(row);
    }
    row.layers.push(layer);
  }
  return rows;
}

export function canPlaceClipOnTrack(
  state: ProjectState,
  request: { id: LayerId; trackId: TrackId; start: number; end: number },
): boolean {
  const { id, trackId, start, end } = request;
  const source = state.layers.find((layer) => layer.id === id);
  const targetExists = state.layers.some(
    (layer) => trackIdFor(layer) === trackId,
  );
  const members = state.layers.filter(
    (layer) => trackIdFor(layer) === trackId && layer !== source,
  );
  if (
    !source ||
    source.locked ||
    !validTrackId(trackId) ||
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    end <= start ||
    !targetExists
  ) {
    return false;
  }
  return !members.some(
    (layer) =>
      layer.locked ||
      (start < layer.end - 0.00001 && end > layer.start + 0.00001),
  );
}

export function moveClipToTrack(
  state: EditorState,
  request: { id: LayerId; placement: ClipTrackPlacement },
): boolean {
  const { id, placement } = request;
  const source = state.layers.find((layer) => layer.id === id);
  if (
    !source ||
    source.locked ||
    !Number.isFinite(source.start) ||
    !Number.isFinite(source.end) ||
    source.start < 0 ||
    source.end <= source.start
  ) {
    return false;
  }

  const rows = trackRows(state);
  const currentTrackId = trackIdFor(source);
  let destinationId: TrackId;
  let name: string;
  let targetMembers: Layer[];
  let before = false;
  if (placement.newTrack) {
    const newTrack = placement.newTrack;
    const target = rows.find((row) => row.id === newTrack.targetTrackId);
    if (
      !validTrackId(newTrack.id) ||
      rows.some((row) => row.id === newTrack.id) ||
      !newTrack.name.trim() ||
      !target
    ) {
      return false;
    }
    destinationId = newTrack.id;
    name = newTrack.name.trim();
    targetMembers = target.layers.filter((layer) => layer !== source);
    before = newTrack.before;
  } else {
    const target = rows.find(
      (row) => row.id === placement.destinationTrackId,
    );
    if (
      !target ||
      placement.destinationTrackId === currentTrackId ||
      !canPlaceClipOnTrack(state, {
        id,
        trackId: placement.destinationTrackId,
        start: source.start,
        end: source.end,
      })
    ) {
      return false;
    }
    destinationId = placement.destinationTrackId;
    name = target.layers[0].trackName || target.layers.at(-1)?.name || source.name;
    targetMembers = target.layers;
  }

  const originalIndex = state.layers.indexOf(source);
  const next = state.layers.filter((layer) => layer !== source);
  const moved = structuredClone(source);
  moved.trackId = destinationId;
  moved.trackName = name;
  const indices = targetMembers
    .map((layer) => next.indexOf(layer))
    .filter((index) => index >= 0);
  let insertion: number;
  if (placement.newTrack) {
    insertion = indices.length
      ? before
        ? Math.max(...indices) + 1
        : Math.min(...indices)
      : Math.min(originalIndex, next.length);
  } else {
    insertion = indices.length ? Math.min(...indices) + 1 : next.length;
  }
  next.splice(insertion, 0, moved);
  state.layers = next;
  return true;
}

export function reorderTrack(
  state: EditorState,
  source: TrackId,
  target: TrackId,
  before: boolean,
): boolean {
  const rows = trackRows(state);
  const index = rows.findIndex((row) => row.id === source);
  const destination = rows.findIndex((row) => row.id === target);
  if (
    index < 0 ||
    destination < 0 ||
    index === destination ||
    rows[index].layers.some((layer) => layer.locked)
  ) {
    return false;
  }
  const [row] = rows.splice(index, 1);
  rows.splice(rows.findIndex((item) => item.id === target) + (before ? 0 : 1), 0, row);
  state.layers = rows.reverse().flatMap((item) => item.layers.reverse());
  return true;
}

export function setTrackProperty(
  state: EditorState,
  request: {
    ids: LayerId[];
    key: 'trackName' | 'visible' | 'locked' | 'muted';
    value: string | boolean;
  },
): boolean {
  const { ids, key, value } = request;
  const members = state.layers.filter(
    (layer) => layer.id !== undefined && ids.includes(layer.id),
  );
  if (!members.length) return false;
  if (key === 'trackName') {
    if (
      typeof value !== 'string' ||
      !value.trim() ||
      members.some((layer) => layer.locked)
    ) {
      return false;
    }
    for (const layer of members) layer.trackName = value.trim();
  } else {
    if (typeof value !== 'boolean') throw new Error('Valor de faixa inválido');
    for (const layer of members) layer[key] = value;
  }
  return true;
}
