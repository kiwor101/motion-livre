import type { EditorState } from '../core/editor-state';
import type { Layer } from '../core/project-model';
import { sourceTimeForLayer } from '../core/time-mapping';
import type { MediaAudioRuntime } from './media-audio-runtime';

export interface MediaPlaybackRecord {
  visual: HTMLImageElement | HTMLVideoElement | HTMLAudioElement;
  audio: HTMLAudioElement | null;
  type: string;
  active: boolean;
}

interface PlaybackDependencies {
  audio: MediaAudioRuntime;
  pending: WeakSet<HTMLMediaElement>;
}

function isActive(layer: Layer, time: number): boolean {
  return time >= layer.start && time < layer.end;
}

function selectOwners(
  state: EditorState,
  records: ReadonlyMap<number, MediaPlaybackRecord>,
): Map<MediaPlaybackRecord, Layer> {
  const owners = new Map<MediaPlaybackRecord, Layer>();
  const time = state.playback.time;
  for (const layer of state.layers) {
    const record = layer.id === undefined ? null : records.get(layer.id);
    if (!record) continue;
    const current = owners.get(record);
    const layerIsActive = isActive(layer, time);
    const currentIsActive = current ? isActive(current, time) : false;
    const layerIsNext = !currentIsActive
      && !layerIsActive
      && layer.start >= time
      && (!current || current.start < time || layer.start < current.start);
    if (!current || (layerIsActive && !currentIsActive) || layerIsNext) {
      owners.set(record, layer);
    }
  }
  return owners;
}

function fadeAt(layer: Layer, time: number): number {
  const local = time - layer.start;
  const remaining = layer.end - time;
  return Math.max(
    0,
    Math.min(
      1,
      layer.fadeIn ? local / layer.fadeIn : 1,
      layer.fadeOut ? remaining / layer.fadeOut : 1,
    ),
  );
}

function gainAt(
  state: EditorState,
  layer: Layer,
  active: boolean,
  solo: boolean,
): number {
  const audible = active
    && (layer.type !== 'video' || layer.hasAudio !== false)
    && !state.playback.previewMuted
    && !layer.muted
    && (!solo || layer.solo);
  if (!audible) return 0;
  return Math.max(0, Math.min(2, layer.volume / 100))
    * fadeAt(layer, state.playback.time);
}

function seek(
  element: HTMLMediaElement,
  layer: Layer,
  time: number,
  active: boolean,
  playing: boolean,
  freeRunning: boolean,
): void {
  const upcoming = playing && layer.start > time && layer.start - time <= 0.5;
  if ((!active && !upcoming) || element.readyState < 1) return;
  const layerTime = active ? time : layer.start;
  const target = Math.min(
    Math.max(0, element.duration - 0.001),
    sourceTimeForLayer(layer, layerTime, element.duration),
  );
  // Repeated wall-clock seeks can keep a slow decoder inside one long GOP.
  if (!freeRunning && !element.seeking && Math.abs(element.currentTime - target) > 0.001) {
    element.currentTime = target;
  }
}

function shouldPauseVisualForAudio(
  state: EditorState,
  record: MediaPlaybackRecord,
  layer: Layer,
  element: HTMLMediaElement,
  active: boolean,
): boolean {
  if (element !== record.visual || !record.audio || !state.playback.playing || !active) {
    return false;
  }
  const start = sourceTimeForLayer(layer, layer.start, record.audio.duration);
  return record.audio.paused
    || record.audio.readyState < 2
    || record.audio.currentTime <= start + 0.03;
}

function updateElement(
  state: EditorState,
  record: MediaPlaybackRecord,
  layer: Layer,
  element: HTMLMediaElement,
  audible: HTMLMediaElement,
  gain: number,
  usesAudioGraph: boolean,
  dependencies: PlaybackDependencies,
): void {
  const active = isActive(layer, state.playback.time);
  element.muted = element !== audible || gain === 0;
  element.volume = usesAudioGraph ? 1 : Math.min(1, gain);
  const rate = Math.max(0.0625, Math.min(16, layer.speed));
  if (element.playbackRate !== rate) element.playbackRate = rate;

  const freeRunning = state.playback.playing && record.active && !layer.reverse;
  seek(
    element,
    layer,
    state.playback.time,
    active,
    state.playback.playing,
    freeRunning,
  );

  const mustPause = !state.playback.playing
    || !active
    || layer.reverse
    || shouldPauseVisualForAudio(state, record, layer, element, active);
  if (mustPause) {
    if (!element.paused) element.pause();
  } else if (element.paused && !dependencies.pending.has(element)) {
    dependencies.pending.add(element);
    element.play()
      .catch(() => {})
      .finally(() => dependencies.pending.delete(element));
  }
}

export function syncMediaPlayback(
  state: EditorState,
  records: ReadonlyMap<number, MediaPlaybackRecord>,
  dependencies: PlaybackDependencies,
): void {
  const solo = state.layers.some(
    layer => (layer.type === 'audio' || layer.type === 'video') && layer.solo,
  );
  for (const [record, layer] of selectOwners(state, records)) {
    if (record.type === 'image' || record.type === 'drawing') continue;
    const audible = record.audio || record.visual;
    if (!(audible instanceof HTMLMediaElement)) continue;
    const active = isActive(layer, state.playback.time);
    const gain = gainAt(state, layer, active, solo);
    const usesAudioGraph = dependencies.audio.configure(
      audible,
      layer.audioChannel || 'stereo',
      gain,
      layer.pan / 100,
    );
    for (const element of [record.audio, record.visual]) {
      if (element instanceof HTMLMediaElement) {
        updateElement(
          state,
          record,
          layer,
          element,
          audible,
          gain,
          usesAudioGraph,
          dependencies,
        );
      }
    }
    record.active = active;
  }
}

export function mediaPlaybackTime(
  state: EditorState,
  records: ReadonlyMap<number, MediaPlaybackRecord>,
): number | null | undefined {
  for (const layer of state.layers) {
    if (
      (layer.type !== 'video' && layer.type !== 'audio')
      || !isActive(layer, state.playback.time)
      || layer.reverse
    ) {
      continue;
    }
    const record = layer.id === undefined ? null : records.get(layer.id);
    const element = record?.audio || record?.visual;
    if (!(element instanceof HTMLMediaElement)) continue;
    if (element.paused || element.readyState < 2) return null;
    return Math.max(
      layer.start,
      Math.min(
        layer.end,
        layer.start + (element.currentTime - layer.sourceIn) / Math.max(0.0625, layer.speed),
      ),
    );
  }
  return undefined;
}
