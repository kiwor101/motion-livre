import type { Layer } from '../core/project-model';

export interface ProxyMetadata {
  width?: number;
  height?: number;
  duration?: number;
}

export interface ProxyResult {
  proxied: boolean;
  path: string;
}

export interface ProxyBridge {
  fileUrl?(path: string): string;
  createProxy?(path: string, metadata: ProxyMetadata): Promise<ProxyResult>;
}

interface MediaProxyOptions {
  bridge?: ProxyBridge;
  exporting: boolean;
  original(layer: Layer): string;
  layers(): Layer[];
  onSourceChange(): void;
  isDestroyed(): boolean;
}

export interface MediaProxyRuntime {
  proxy(layer: Layer, metadata: ProxyMetadata): Promise<void>;
  path(layer: Layer): string | undefined;
  url(layer: Layer): string;
  publishStatus(): void;
  setEnabled(enabled: boolean): void;
  clear(): void;
  readonly enabled: boolean;
}

function eligible(metadata: ProxyMetadata): boolean {
  const width = Number(metadata.width) || 0;
  const height = Number(metadata.height) || 0;
  return Math.max(width, height) > 1920 || Math.min(width, height) > 1080;
}

export function createMediaProxyRuntime(options: MediaProxyOptions): MediaProxyRuntime {
  const proxies = new Map<string, string>();
  const jobs = new Map<string, Promise<void>>();
  let enabled = true;

  function path(layer: Layer): string | undefined {
    if (!eligible({ width: layer.mediaWidth, height: layer.mediaHeight })) return undefined;
    return proxies.get(layer.sourcePath || '') || layer.proxyPath;
  }

  function url(layer: Layer): string {
    const proxyPath = path(layer);
    if (!options.exporting && enabled && proxyPath && options.bridge?.fileUrl) {
      return options.bridge.fileUrl(proxyPath);
    }
    return options.original(layer);
  }

  function publishStatus(): void {
    if (options.exporting) return;
    const available = options.layers().some(
      layer => layer.type === 'video' && Boolean(path(layer)),
    );
    window.dispatchEvent(new CustomEvent('motion:proxy-status', {
      detail: { available, enabled },
    }));
  }

  function setEnabled(next: boolean): void {
    if (enabled === next) return;
    enabled = next;
    options.onSourceChange();
    publishStatus();
  }

  async function proxy(layer: Layer, metadata: ProxyMetadata): Promise<void> {
    const bridge = options.bridge;
    if (
      options.exporting
      || layer.type !== 'video'
      || !layer.sourcePath
      || !bridge?.createProxy
      || !eligible(metadata)
    ) {
      return;
    }
    const source = layer.sourcePath;
    if (proxies.has(source)) return;
    const running = jobs.get(source);
    if (running) {
      await running;
      return;
    }
    const job = bridge.createProxy(source, metadata)
      .then(result => {
        if (result?.proxied && !options.isDestroyed()) {
          proxies.set(source, result.path);
          options.onSourceChange();
          publishStatus();
        }
      })
      .finally(() => jobs.delete(source));
    jobs.set(source, job);
    await job;
  }

  function clear(): void {
    proxies.clear();
    jobs.clear();
  }

  return {
    proxy,
    path,
    url,
    publishStatus,
    setEnabled,
    clear,
    get enabled() {
      return enabled;
    },
  };
}
