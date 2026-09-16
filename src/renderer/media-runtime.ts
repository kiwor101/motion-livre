import type { EditorState } from '../core/editor-state';
import type { Layer } from '../core/project-model';
import { createMediaAudioRuntime } from './media-audio-runtime';
import {
  mediaPlaybackTime,
  syncMediaPlayback,
} from './media-playback-runtime';
import { createMediaPreparation } from './media-preparation';
import {
  createMediaProxyRuntime,
  type ProxyBridge,
  type ProxyMetadata,
} from './media-proxy-runtime';
import { createMediaRecordRegistry } from './media-record-registry';
import type { RasterMediaSource, RenderableMedia } from './rasterizer';

export type { ProxyMetadata, ProxyResult } from './media-proxy-runtime';
export type MediaBridge = ProxyBridge;

export interface MediaRuntime extends RasterMediaSource {
  attach(layer: Layer, container: Element): void;
  reconcile(layers: Layer[]): void;
  proxy(layer: Layer, metadata: ProxyMetadata): Promise<void>;
  setProxyEnabled(enabled: boolean): void;
  readonly proxyEnabled: boolean;
  url(layer: Layer): string;
  original(layer: Layer): string;
  sync(state: EditorState): void;
  playbackTime(state: EditorState): number | null | undefined;
  start(): void;
  pause(): void;
  prepare(layers: Layer[], time: number, signal?: AbortSignal): Promise<void>;
  destroy(): Promise<void>;
  readonly size: number;
}

interface MediaRuntimeOptions {
  document: Document;
  bridge?: MediaBridge;
  onChange?: () => void;
  onSourceChange?: () => void;
  exporting?: boolean;
}

export function create({
  document,
  bridge,
  onChange = () => {},
  onSourceChange = onChange,
  exporting = false,
}: MediaRuntimeOptions): MediaRuntime {
  const pending = new WeakSet<HTMLMediaElement>();
  const audioRuntime = createMediaAudioRuntime();
  let destroyed = false;
  let destroyPromise: Promise<void> | null = null;

  const original = (layer: Layer): string => (
    layer.sourcePath && bridge?.fileUrl
      ? bridge.fileUrl(layer.sourcePath)
      : layer.content || String(layer.url || '')
  );

  let resolveUrl = original;
  const registry = createMediaRecordRegistry({
    document,
    exporting,
    sources: layer => ({
      visual: resolveUrl(layer),
      audio: !exporting && layer.type === 'video' && layer.hasAudio !== false
        ? original(layer)
        : '',
    }),
    onChange,
    releaseAudio: element => audioRuntime.release(element),
    isDestroyed: () => destroyed,
  });
  const proxyRuntime = createMediaProxyRuntime({
    bridge,
    exporting,
    original,
    layers: () => registry.layers(),
    onSourceChange,
    isDestroyed: () => destroyed,
  });
  const url = (layer: Layer): string => proxyRuntime.url(layer);
  resolveUrl = url;

  const records = registry.records;
  const preparation = createMediaPreparation({
    reconcile: layers => reconcile(layers),
    get: layer => get(layer),
  });

  function setProxyEnabled(enabled: boolean): void {
    proxyRuntime.setEnabled(enabled);
  }

  function get(layer: Layer): RenderableMedia | null {
    const visual = registry.ensure(layer)?.visual;
    return visual instanceof HTMLImageElement || visual instanceof HTMLVideoElement
      ? visual
      : null;
  }

  function attach(layer: Layer, container: Element): void {
    registry.attach(layer, container);
  }

  function reconcile(layers: Layer[]): void {
    registry.reconcile(layers);
    proxyRuntime.publishStatus();
  }

  async function proxy(layer: Layer, metadata: ProxyMetadata): Promise<void> {
    await proxyRuntime.proxy(layer, metadata);
  }

  function sync(state: EditorState): void {
    if (exporting) return;
    syncMediaPlayback(state, records, { audio: audioRuntime, pending });
  }

  function pause(): void {
    registry.pause();
  }

  function playbackTime(state: EditorState): number | null | undefined {
    return mediaPlaybackTime(state, records);
  }

  function start(): void {
    if (!destroyed) audioRuntime.start();
  }

  async function prepare(
    layers: Layer[],
    time: number,
    signal?: AbortSignal,
  ): Promise<void> {
    await preparation.prepare(layers, time, signal);
  }

  function destroy(): Promise<void> {
    if (destroyPromise) return destroyPromise;
    destroyed = true;
    destroyPromise = (async () => {
      // Disconnect each element's graph before closing the shared audio context.
      registry.clear();
      proxyRuntime.clear();
      await audioRuntime.close();
    })();
    return destroyPromise;
  }

  return {
    get,
    attach,
    reconcile,
    proxy,
    setProxyEnabled,
    get proxyEnabled() {
      return proxyRuntime.enabled;
    },
    url,
    original,
    sync,
    playbackTime,
    start,
    pause,
    prepare,
    destroy,
    get size() {
      return registry.size;
    },
  };
}
