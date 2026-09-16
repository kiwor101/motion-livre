import type { Layer } from '../core/project-model';
import type { MediaPlaybackRecord } from './media-playback-runtime';

export interface MediaRecord extends MediaPlaybackRecord {
  src: string;
  audioSrc: string;
  listeners: Array<() => void>;
}

interface MediaSources {
  visual: string;
  audio: string;
}

interface RegistryOptions {
  document: Document;
  exporting: boolean;
  sources(layer: Layer): MediaSources;
  onChange(): void;
  releaseAudio(element: HTMLMediaElement): void;
  isDestroyed(): boolean;
}

export interface MediaRecordRegistry {
  readonly records: ReadonlyMap<number, MediaRecord>;
  ensure(layer: Layer): MediaRecord | null;
  attach(layer: Layer, container: Element): MediaRecord | null;
  reconcile(layers: Layer[]): void;
  layers(): Layer[];
  pause(): void;
  clear(): void;
  readonly size: number;
}

function layerKey(layer: Layer): number {
  if (layer.id === undefined) throw new Error('Camada de mídia sem ID');
  return layer.id;
}

function overlaps(first: Layer, second: Layer): boolean {
  return first.start < second.end && second.start < first.end;
}

function createVisual(document: Document, layer: Layer): HTMLImageElement | HTMLMediaElement {
  if (layer.type === 'image' || layer.type === 'drawing') {
    return document.createElement('img');
  }
  return document.createElement(layer.type === 'video' ? 'video' : 'audio');
}

export function createMediaRecordRegistry(options: RegistryOptions): MediaRecordRegistry {
  const records = new Map<number, MediaRecord>();
  const members = new Map<number, Layer>();
  const containers = new Map<number, Element>();

  function release(record: MediaRecord): void {
    for (const element of [record.visual, record.audio]) {
      if (!element) continue;
      if (element instanceof HTMLMediaElement) {
        options.releaseAudio(element);
        element.pause();
      }
      element.removeAttribute('src');
      if (element instanceof HTMLMediaElement) element.load();
      element.remove();
    }
    for (const dispose of record.listeners) dispose();
  }

  function isSharedWithOverlap(id: number, record: MediaRecord, layer: Layer): boolean {
    return [...records].some(([otherId, other]) => (
      otherId !== id
      && other === record
      && overlaps(layer, members.get(otherId)!)
    ));
  }

  function canReuse(record: MediaRecord, layer: Layer, sources: MediaSources): boolean {
    return record.src === sources.visual
      && record.audioSrc === sources.audio
      && record.type === layer.type
      && ![...records].some(([id, other]) => (
        other === record && overlaps(layer, members.get(id)!)
      ));
  }

  function createRecord(layer: Layer, sources: MediaSources): MediaRecord {
    const visual = createVisual(options.document, layer);
    const record: MediaRecord = {
      visual,
      audio: null,
      src: sources.visual,
      audioSrc: sources.audio,
      type: layer.type,
      listeners: [],
      active: false,
    };
    if (visual instanceof HTMLMediaElement) {
      visual.preload = 'auto';
      if (visual instanceof HTMLVideoElement) visual.playsInline = true;
      visual.muted = true;
    }
    visual.src = sources.visual;
    if (sources.audio) {
      record.audio = options.document.createElement('audio');
      record.audio.preload = 'auto';
      record.audio.src = sources.audio;
    }
    for (const element of [visual, record.audio]) {
      if (!element) continue;
      for (const event of ['load', 'loadeddata', 'seeked', 'error']) {
        const listener = (): void => {
          if (!options.isDestroyed()) options.onChange();
        };
        element.addEventListener(event, listener);
        record.listeners.push(() => element.removeEventListener(event, listener));
      }
    }
    return record;
  }

  function ensure(layer: Layer): MediaRecord | null {
    if (!['image', 'drawing', 'video', 'audio'].includes(layer.type)) return null;
    const id = layerKey(layer);
    const sources = options.sources(layer);
    members.set(id, layer);
    let record = records.get(id) || null;
    const changed = record && (
      record.src !== sources.visual
      || record.audioSrc !== sources.audio
      || record.type !== layer.type
      || isSharedWithOverlap(id, record, layer)
    );
    if (record && changed) {
      records.delete(id);
      if (![...records.values()].includes(record)) release(record);
      record = null;
    }
    if (record) return record;

    // Disjoint video clips may share one decoder; overlapping clips cannot.
    if (!options.exporting && layer.type === 'video') {
      for (const candidate of new Set(records.values())) {
        if (canReuse(candidate, layer, sources)) {
          records.set(id, candidate);
          return candidate;
        }
      }
    }
    record = createRecord(layer, sources);
    records.set(id, record);
    return record;
  }

  function attach(layer: Layer, container: Element): MediaRecord | null {
    containers.set(layerKey(layer), container);
    const record = ensure(layer);
    if (!record) return null;
    if (!record.visual.parentElement) container.append(record.visual);
    if (record.audio && !record.audio.parentElement) container.append(record.audio);
    return record;
  }

  function reconcile(layers: Layer[]): void {
    const ids = new Set(layers.flatMap(layer => layer.id === undefined ? [] : [layer.id]));
    for (const [id, record] of records) {
      if (ids.has(id)) continue;
      records.delete(id);
      members.delete(id);
      containers.delete(id);
      if (![...records.values()].includes(record)) release(record);
    }
    for (const record of new Set(records.values())) {
      const owners = [...records]
        .filter(([, candidate]) => candidate === record)
        .map(([id]) => containers.get(id))
        .filter((container): container is Element => Boolean(container));
      if (!owners.length) continue;
      if (!owners.includes(record.visual.parentElement!)) owners[0].append(record.visual);
      if (record.audio && !owners.includes(record.audio.parentElement!)) {
        owners[0].append(record.audio);
      }
    }
  }

  function pause(): void {
    for (const record of new Set(records.values())) {
      if (record.visual instanceof HTMLMediaElement) record.visual.pause();
      record.audio?.pause();
    }
  }

  function clear(): void {
    for (const record of new Set(records.values())) release(record);
    records.clear();
    members.clear();
    containers.clear();
  }

  return {
    records,
    ensure,
    attach,
    reconcile,
    layers: () => [...members.values()],
    pause,
    clear,
    get size() {
      return new Set(records.values()).size;
    },
  };
}
