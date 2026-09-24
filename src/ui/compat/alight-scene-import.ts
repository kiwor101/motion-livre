import type { ImportedProject } from '../../core/project-commands';
import { parseAlightLayer } from './alight-layer-import';
import {
  collectLayerNodes,
  createMediaCatalog,
} from './alight-import-structure';
import type { AlightReport } from './alight-types';
import {
  argbToHex,
  attributesOf,
  clamp,
  directAll,
  num,
  parseXml,
} from './alight-xml-utils';

export interface ImportAlightSceneOptions {
  xml: string;
  firstLayerId: number;
  fileUri(path: string | undefined): string;
}

export interface ImportedAlightScene {
  project: ImportedProject;
  title: string;
  aspect: string;
  nextLayerId: number;
  report: AlightReport;
}

function aspectFor(width: number, height: number): string {
  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) < 0.05) return '16/9';
  if (Math.abs(ratio - 9 / 16) < 0.05) return '9/16';
  if (Math.abs(ratio - 1) < 0.05) return '1/1';
  return '4/5';
}

export function importAlightScene(
  options: ImportAlightSceneOptions,
): ImportedAlightScene {
  const root = parseXml(options.xml).documentElement;
  const width = clamp(root.getAttribute('width') || 1920, 64, 7680);
  const height = clamp(root.getAttribute('height') || 1080, 64, 7680);
  const fps = clamp(root.getAttribute('fps') || 30, 30, 240);
  const duration = clamp(
    num(root.getAttribute('totalTime'), 10_000) / 1000,
    0.05,
    3600,
  );
  const composition = {
    width,
    height,
    fps,
    background: argbToHex(root.getAttribute('bgcolor') || '#FF08090B'),
  };
  const report: AlightReport = {
    layers: 0,
    keyframes: 0,
    unsupportedEffects: new Set<string>(),
    unresolvedMedia: [],
    sourceVersion: root.getAttribute('amver') || 'desconhecida',
  };
  const catalog = createMediaCatalog(root);
  const idMap = new Map<string | null, number>();
  const parents = new Map<number, string>();
  let nextLayerId = options.firstLayerId;
  const layers = collectLayerNodes(root).map((item) => {
    const layer = parseAlightLayer({
      node: item.node,
      catalog,
      composition,
      duration,
      report,
      id: nextLayerId++,
      fileUri: options.fileUri,
    });
    if (layer.id === undefined) {
      throw new Error('Camada importada sem identificador');
    }
    idMap.set(item.node.getAttribute('id'), layer.id);
    if (item.parentOriginalId) parents.set(layer.id, item.parentOriginalId);
    return layer;
  });

  // Parenting is resolved after every original layer ID is known.
  for (const layer of layers) {
    if (layer.id === undefined) continue;
    const originalParent = parents.get(layer.id);
    if (originalParent) layer.parentId = idMap.get(originalParent) || null;
  }

  const markers = directAll(root, 'bookmark')
    .slice(0, 10_000)
    .map((node) => clamp(num(node.getAttribute('t')) / 1000, 0, duration))
    .sort((a, b) => a - b);

  report.layers = layers.length;
  report.keyframes = layers.reduce(
    (total, layer) => total + layer.keyframes.length,
    0,
  );
  report.unsupportedEffects = [...report.unsupportedEffects];

  return {
    project: {
      duration,
      composition,
      layers,
      markers,
      alightScene: { attributes: attributesOf(root) },
    },
    title: root.getAttribute('title') || 'Cena XML importada',
    aspect: aspectFor(width, height),
    nextLayerId,
    report,
  };
}
