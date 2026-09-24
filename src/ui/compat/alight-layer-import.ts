import type { Composition } from '../../core/editor-state';
import {
  createLayer,
  type AlightMediaReference,
  type Layer,
} from '../../core/project-model';
import { importAnimated } from './alight-animation-import';
import { readAlightEffect } from './alight-effect-import';
import {
  pathPointsFromData,
  resolveMedia,
  type ResolvedMedia,
} from './alight-import-structure';
import type { AlightReport } from './alight-types';
import {
  argbToHex,
  attributesOf,
  BLEND_BY_NUMBER,
  clamp,
  direct,
  directAll,
  KNOWN_LAYER_CHILDREN,
  mediaType,
  num,
  propertyData,
  propertyValue,
  round,
  vector,
} from './alight-xml-utils';

const supportedBlends = new Set([
  'normal',
  'multiply',
  'screen',
  'overlay',
  'lighten',
  'darken',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
]);

export interface ParseAlightLayerOptions {
  node: Element;
  catalog: Map<string, AlightMediaReference>;
  composition: Composition;
  duration: number;
  report: AlightReport;
  id: number;
  fileUri(path: string | undefined): string;
}

function baseLayer(
  id: number,
  type: string,
  content: string,
  name: string,
  duration: number,
): Layer {
  return {
    ...createLayer({ id, type, content: content || '', name: name || type, duration }),
    alightEffects: [],
    alightProperties: [],
  };
}

function layerType(node: Element, media: ResolvedMedia): string {
  const tag = node.tagName;
  const shape = node.getAttribute('s') || '.rect';
  const fillType = node.getAttribute('fillType') || 'color';

  if (tag === 'shape' || tag === 'color') {
    if (fillType === 'media') return mediaType(media.uri, media.mime);
    if (shape.includes('circle') || shape.includes('ellipse')) return 'circle';
    return direct(node, 'path') ? 'path' : 'rect';
  }
  if (tag === 'group') return 'null';
  if (tag === 'drawing') return direct(node, 'path') ? 'path' : 'drawing';
  if (tag === 'media' || tag === 'image' || tag === 'video') {
    return mediaType(media.uri, media.mime);
  }
  return tag;
}

function applyTransform(
  layer: Layer,
  node: Element,
  composition: Composition,
): void {
  const transform = direct(node, 'transform');
  if (!transform) return;

  importAnimated(layer, direct(transform, 'location'), ['x', 'y'], (raw) => {
    const [x, y] = vector(raw);
    return {
      x: (x / composition.width) * 100,
      y: (y / composition.height) * 100,
    };
  });
  importAnimated(layer, direct(transform, 'scale'), ['scale'], (raw) => {
    const [x, y] = vector(raw);
    return { scale: ((Math.abs(x) + Math.abs(y)) / 2) * 100 };
  });
  importAnimated(layer, direct(transform, 'rotation'), ['rotation'], (raw) => ({
    rotation: num(raw),
  }));
  importAnimated(layer, direct(transform, 'opacity'), ['opacity'], (raw) => ({
    opacity: clamp(num(raw, 1) * 100, 0, 100),
  }));

  const anchor = direct(transform, 'anchor');
  if (anchor?.hasAttribute('value')) {
    const [x, y] = vector(anchor.getAttribute('value'));
    layer.anchorX = clamp((x / composition.width) * 100, 0, 100);
    layer.anchorY = clamp((y / composition.height) * 100, 0, 100);
  }
}

function applyAppearance(
  layer: Layer,
  node: Element,
  composition: Composition,
): void {
  const fill = direct(node, 'fillColor');
  if (fill) layer.color = argbToHex(fill.getAttribute('value'));

  const gradient = direct(node, 'gradient');
  if (gradient) {
    layer.fillType = gradient.getAttribute('type') === 'radial' ? 'radial' : 'linear';
    layer.color = argbToHex(gradient.getAttribute('startColor'));
    layer.gradientColor = argbToHex(gradient.getAttribute('endColor'));
    const [x1, y1] = vector(gradient.getAttribute('start'));
    const [x2, y2] = vector(gradient.getAttribute('end'));
    layer.gradientAngle = round(
      ((Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI + 360) % 360,
    );
  }

  const shape = node.getAttribute('s') || '.rect';
  const blend =
    direct(node, 'blendMode')?.getAttribute('value') ||
    node.getAttribute('blendMode') ||
    (!shape.startsWith('.') ? shape : 'normal');
  layer.alightBlend = blend;
  layer.blend = BLEND_BY_NUMBER[blend] || (blend === 'diff' ? 'difference' : blend);
  if (!supportedBlends.has(layer.blend)) layer.blend = 'normal';

  const path = direct(node, 'path');
  if (path) {
    layer.alightPath = String(path.getAttribute('d') || '').slice(0, 200_000);
    layer.pathPoints = pathPointsFromData(
      layer.alightPath,
      composition.width,
      composition.height,
    );
    layer.stroke = Math.max(1, layer.stroke || 2);
  }
}

function applyText(layer: Layer, node: Element): void {
  if (node.tagName !== 'text') return;

  layer.fontSize = clamp(node.getAttribute('size') || 42, 8, 500);
  layer.textAlign = node.getAttribute('align') || 'center';
  const font = node.getAttribute('font') || '';
  const match = font.match(/[?&]name=([^&]+)/);
  if (match) layer.font = decodeURIComponent(match[1].replace(/\+/g, ' '));
}

function applyPropertiesAndStroke(layer: Layer, node: Element): void {
  layer.alightProperties = directAll(node, 'property')
    .slice(0, 1000)
    .map(propertyData);

  const size = layer.alightProperties.find((property) => property.name === 'size');
  if (size && node.tagName === 'text') {
    layer.fontSize = clamp(propertyValue(size, layer.fontSize), 8, 500);
  }

  const stroke = direct(node, 'stroke');
  if (!stroke) return;

  const properties = directAll(stroke, 'property').map(propertyData);
  const width = properties.find((property) => /width|size/i.test(property.name));
  const color = properties.find((property) => /color/i.test(property.name));
  if (width) layer.stroke = clamp(propertyValue(width, 1), 0, 100);
  if (color?.value) layer.strokeColor = argbToHex(color.value);
}

function preserveMetadata(layer: Layer, node: Element): void {
  const standardAttributes = new Set([
    'id',
    'label',
    'startTime',
    'endTime',
    'fillType',
    's',
    'size',
    'font',
    'wrapWidth',
    'align',
    'uri',
    'src',
    'type',
    'blendMode',
  ]);

  layer.alightAttributes = {};
  for (const attribute of node.attributes) {
    if (!standardAttributes.has(attribute.name)) {
      layer.alightAttributes[attribute.name] = attribute.value;
    }
  }
  layer.alightExtras = [...node.children]
    .filter((child) => !KNOWN_LAYER_CHILDREN.has(child.tagName))
    .slice(0, 100)
    .map((child) =>
      new XMLSerializer().serializeToString(child).slice(0, 200_000),
    );
}

export function parseAlightLayer({
  node,
  catalog,
  composition,
  duration,
  report,
  id,
  fileUri,
}: ParseAlightLayerOptions): Layer {
  const tag = node.tagName;
  const shape = node.getAttribute('s') || '.rect';
  const media = resolveMedia(node, catalog);
  const type = layerType(node, media);
  const content =
    type === 'text'
      ? direct(node, 'content')?.textContent || 'Texto importado'
      : media.sourcePath
        ? fileUri(media.sourcePath)
        : '';
  const layer = baseLayer(
    id,
    type,
    content,
    node.getAttribute('label') || media.name || `Camada ${tag}`,
    duration,
  );

  layer.alightId = node.getAttribute('id') || String(layer.id);
  layer.alightTag = tag;
  layer.alightShape = shape;
  layer.alightMedia = {
    uri: media.uri,
    filename: media.filename,
    mime: media.mime,
    title: media.title,
  };
  layer.start = clamp(num(node.getAttribute('startTime')) / 1000, 0, duration);
  layer.end = clamp(
    num(node.getAttribute('endTime'), duration * 1000) / 1000,
    layer.start + 0.001,
    duration,
  );
  layer.sourcePath = media.sourcePath;
  layer.sourceIn = 0;
  layer.sourceOut = Math.max(0.001, layer.end - layer.start);
  layer.mediaDuration = layer.sourceOut;

  if (['image', 'video', 'audio'].includes(type) && !media.sourcePath) {
    report.unresolvedMedia.push(media.name || media.uri || layer.name);
  }

  applyTransform(layer, node, composition);
  applyAppearance(layer, node, composition);
  applyText(layer, node);
  applyPropertiesAndStroke(layer, node);
  for (const effect of directAll(node, 'effect')) {
    readAlightEffect(layer, effect, report);
  }
  preserveMetadata(layer, node);

  layer.keyframes.sort((left, right) => left.time - right.time);
  layer.easing = layer.keyframes.find((keyframe) => keyframe.easing)?.easing || 'linear';
  return layer;
}
