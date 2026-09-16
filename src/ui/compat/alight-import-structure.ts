import type { AlightMediaReference } from '../../core/project-model';
import {
  clamp,
  direct,
  directAll,
  LAYER_TAGS,
  localPathFromUri,
  MAX_LAYERS,
} from './alight-xml-utils';

export interface CollectedLayer {
  node: Element;
  parentOriginalId: string | null;
}

export interface ResolvedMedia extends AlightMediaReference {
  sourcePath: string;
  name: string;
}

export function collectLayerNodes(root: Element): CollectedLayer[] {
  const collected: CollectedLayer[] = [];

  const walk = (parent: Element, parentOriginalId: string | null = null): void => {
    for (const child of parent.children) {
      if (!LAYER_TAGS.has(child.tagName)) continue;

      const isDefinition =
        child.tagName === 'media' &&
        !child.hasAttribute('startTime') &&
        !child.hasAttribute('endTime');
      if (isDefinition) continue;

      collected.push({ node: child, parentOriginalId });
      if (child.tagName === 'group') walk(child, child.getAttribute('id'));
    }
  };

  walk(root);
  if (collected.length > MAX_LAYERS) {
    throw new Error(`A cena excede o limite de ${MAX_LAYERS} camadas`);
  }
  return collected;
}

export function createMediaCatalog(
  root: Element,
): Map<string, AlightMediaReference> {
  const catalog = new Map<string, AlightMediaReference>();

  for (const media of directAll(root, 'media')) {
    if (media.hasAttribute('startTime') || media.hasAttribute('endTime')) continue;

    const entry = {
      uri: media.getAttribute('uri') || '',
      filename: media.getAttribute('filename') || '',
      mime: media.getAttribute('type') || '',
      title: media.getAttribute('title') || '',
    };
    const keys = [
      entry.uri,
      entry.filename,
      media.getAttribute('sig'),
      media.getAttribute('id'),
    ];
    for (const key of keys) {
      if (key) catalog.set(key, entry);
    }
  }

  return catalog;
}

export function resolveMedia(
  node: Element,
  catalog: Map<string, AlightMediaReference>,
): ResolvedMedia {
  const fill = direct(node, 'fillImage');
  const reference =
    node.getAttribute('uri') ||
    node.getAttribute('src') ||
    node.getAttribute('fillImage') ||
    fill?.getAttribute('value') ||
    '';
  const entry =
    catalog.get(reference) ||
    [...catalog.values()].find(
      (item) => item.uri === reference || item.filename === reference,
    ) || {
      uri: reference,
      filename: node.getAttribute('label') || '',
      mime: node.getAttribute('type') || '',
      title: '',
    };

  const uri = entry.uri || reference;
  return {
    uri,
    sourcePath: localPathFromUri(uri),
    mime: entry.mime || node.getAttribute('type') || '',
    filename: entry.filename || '',
    title: entry.title || '',
    name:
      entry.title ||
      entry.filename ||
      node.getAttribute('label') ||
      'Mídia importada',
  };
}

export function pathPointsFromData(
  data: unknown,
  width: number,
  height: number,
): Array<[number, number]> {
  const values = (String(data || '').match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || []).map(
    Number,
  );
  const points: Array<[number, number]> = [];

  for (let index = 0; index + 1 < values.length && points.length < 1000; index += 2) {
    points.push([
      clamp((values[index] / Math.max(1, width)) * 100, 0, 100),
      clamp((values[index + 1] / Math.max(1, height)) * 100, 0, 100),
    ]);
  }
  return points;
}
