import type { Layer } from '../core/project-model';
import { sourceTimeForLayer } from '../core/time-mapping';
import type { RenderableMedia } from './rasterizer';

interface MediaPreparationOptions {
  reconcile(layers: Layer[]): void;
  get(layer: Layer): RenderableMedia | null;
}

export interface MediaPreparation {
  prepare(layers: Layer[], time: number, signal?: AbortSignal): Promise<void>;
}

function unavailable(element: HTMLMediaElement | HTMLImageElement): Error {
  return new Error(`Mídia indisponível: ${element.src}`);
}

async function waitFor(
  element: HTMLElement,
  event: string,
  signal?: AbortSignal,
): Promise<void> {
  if (signal?.aborted) throw new DOMException('Cancelado', 'AbortError');
  await new Promise<void>((resolve, reject) => {
    let timer = 0;
    const cleanup = (): void => {
      clearTimeout(timer);
      element.removeEventListener(event, done);
      element.removeEventListener('error', fail);
      signal?.removeEventListener('abort', abort);
    };
    const done = (): void => {
      cleanup();
      resolve();
    };
    const fail = (): void => {
      cleanup();
      reject(unavailable(element as HTMLMediaElement | HTMLImageElement));
    };
    const abort = (): void => {
      cleanup();
      reject(new DOMException('Cancelado', 'AbortError'));
    };
    timer = window.setTimeout(fail, 15_000);
    element.addEventListener(event, done, { once: true });
    element.addEventListener('error', fail, { once: true });
    signal?.addEventListener('abort', abort, { once: true });
  });
}

async function prepareImage(
  element: HTMLImageElement,
  signal?: AbortSignal,
): Promise<void> {
  if (!element.complete) await waitFor(element, 'load', signal);
  if (!element.naturalWidth) throw new Error('Imagem indisponível');
}

async function seekVideo(
  element: HTMLVideoElement,
  layer: Layer,
  time: number,
  signal?: AbortSignal,
): Promise<void> {
  const target = Math.min(
    Math.max(0, element.duration - 0.001),
    sourceTimeForLayer(layer, time, element.duration),
  );
  if (Math.abs(element.currentTime - target) <= 0.00001) return;
  const ready = waitFor(element, 'seeked', signal);
  element.currentTime = target;
  await ready;
}

async function prepareVideo(
  element: HTMLVideoElement,
  layer: Layer,
  time: number,
  signal?: AbortSignal,
): Promise<void> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (element.error || attempt) element.load();
      if (element.readyState < 2) await waitFor(element, 'loadeddata', signal);
      await seekVideo(element, layer, time, signal);
      return;
    } catch (error) {
      const aborted = signal?.aborted
        || (error instanceof DOMException && error.name === 'AbortError');
      if (aborted || attempt === 1) throw error;
    }
  }
  throw unavailable(element);
}

function activeVisualLayers(layers: Layer[], time: number): Layer[] {
  return layers.filter(layer => (
    layer.visible
    && time >= layer.start
    && time < layer.end
    && (layer.type === 'video' || layer.type === 'image' || layer.type === 'drawing')
  ));
}

export function createMediaPreparation(
  options: MediaPreparationOptions,
): MediaPreparation {
  async function prepare(
    layers: Layer[],
    time: number,
    signal?: AbortSignal,
  ): Promise<void> {
    const active = activeVisualLayers(layers, time);
    options.reconcile(active);
    await Promise.all(active.map(async layer => {
      const element = options.get(layer);
      if (!element) throw new Error('Mídia visual indisponível');
      if (element instanceof HTMLImageElement) {
        await prepareImage(element, signal);
        return;
      }
      if (!(element instanceof HTMLVideoElement)) {
        throw new Error('Tipo de mídia visual inválido');
      }
      await prepareVideo(element, layer, time, signal);
    }));
  }

  return { prepare };
}
