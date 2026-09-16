import type { EditorState } from '../../core/editor-state';
import type { Layer, ProjectKeyframe } from '../../core/project-model';
import {
  appendAlightEffect,
  appendAlightProperty,
  generatedAlightEffects,
} from './alight-effect-export';
import {
  clamp,
  hexToArgb,
  LAYER_TAGS,
  normalizeEffectId,
  parseXmlFragment,
  round,
} from './alight-xml-utils';

export interface AlightMediaInfo {
  uri: string;
  filename: string;
  mime: string;
}

interface LayerExportContext {
  state: EditorState;
  fileUri(path: string | undefined): string;
}

function addStaticOrAnimated(
  document: XMLDocument,
  parent: Element,
  name: string,
  layer: Layer,
  properties: string[],
  format: (values: Record<string, number>) => string,
  duration: number,
): void {
  const node = document.createElement(name);
  const keyframes = (layer.keyframes || [])
    .filter((keyframe) =>
      properties.some((property) => Number.isFinite(keyframe.values?.[property])),
    )
    .sort((left, right) => left.time - right.time);
  const layerDuration = Math.max(
    0.001,
    (layer.end ?? duration) - (layer.start || 0),
  );
  const valuesFor = (keyframe: ProjectKeyframe | undefined): string =>
    format(
      Object.fromEntries(
        properties.map((property) => [
          property,
          Number.isFinite(keyframe?.values?.[property])
            ? keyframe!.values[property]
            : Number(layer[property]),
        ]),
      ),
    );

  if (keyframes.length > 1) {
    keyframes.forEach((keyframe, index) => {
      const frame = document.createElement('kf');
      frame.setAttribute(
        't',
        String(
          round(
            clamp(
              (keyframe.time - (layer.start || 0)) / layerDuration,
              0,
              1,
            ),
          ),
        ),
      );
      frame.setAttribute('v', valuesFor(keyframe));

      const next = keyframes[index + 1];
      if (next) {
        const easing =
          next.easings?.[properties[0]] ||
          next.easing ||
          layer.easing ||
          'linear';
        if (easing !== 'linear') frame.setAttribute('e', easing);
      }
      node.append(frame);
    });
  } else {
    node.setAttribute('value', valuesFor(keyframes[0]));
  }
  parent.append(node);
}

function pathData(layer: Layer, state: EditorState): string {
  if (layer.alightPath) return layer.alightPath;
  return (layer.pathPoints || [])
    .map(
      (point, index) =>
        `${index ? 'L' : 'M'} ${round(
          (point[0] / 100) * state.composition.width,
        )} ${round((point[1] / 100) * state.composition.height)}`,
    )
    .join(' ');
}

export function alightMediaInfo(
  layer: Layer,
  fileUri: (path: string | undefined) => string,
): AlightMediaInfo {
  const uri = fileUri(layer.sourcePath) || layer.alightMedia?.uri || '';
  const filename =
    String(
      layer.sourcePath || layer.alightMedia?.filename || layer.name || 'media',
    )
      .split(/[\\/]/)
      .pop() || 'media';
  const mime =
    layer.alightMedia?.mime ||
    (layer.type === 'video'
      ? 'video/mp4'
      : layer.type === 'audio'
        ? 'audio/mpeg'
        : 'image/png');
  return { uri, filename, mime };
}

function appendTransform(
  document: XMLDocument,
  node: Element,
  layer: Layer,
  state: EditorState,
): void {
  const transform = document.createElement('transform');
  addStaticOrAnimated(
    document,
    transform,
    'location',
    layer,
    ['x', 'y'],
    (values) =>
      `${round((values.x / 100) * state.composition.width)},${round(
        (values.y / 100) * state.composition.height,
      )}`,
    state.duration,
  );
  addStaticOrAnimated(
    document,
    transform,
    'scale',
    layer,
    ['scale'],
    (values) => `${round(values.scale / 100)},${round(values.scale / 100)}`,
    state.duration,
  );
  addStaticOrAnimated(
    document,
    transform,
    'rotation',
    layer,
    ['rotation'],
    (values) => String(round(values.rotation)),
    state.duration,
  );

  const anchor = document.createElement('anchor');
  anchor.setAttribute(
    'value',
    `${round(((layer.anchorX ?? 50) / 100) * state.composition.width)},${round(
      ((layer.anchorY ?? 50) / 100) * state.composition.height,
    )}`,
  );
  transform.append(anchor);
  addStaticOrAnimated(
    document,
    transform,
    'opacity',
    layer,
    ['opacity'],
    (values) => String(round(values.opacity / 100)),
    state.duration,
  );
  node.append(transform);
}

function appendFill(
  document: XMLDocument,
  node: Element,
  layer: Layer,
  tag: string,
  media: boolean,
  context: LayerExportContext,
): void {
  if (media) {
    const fill = document.createElement('fillImage');
    fill.setAttribute('value', alightMediaInfo(layer, context.fileUri).uri);
    node.append(fill);
  } else if (layer.fillType === 'linear' || layer.fillType === 'radial') {
    const gradient = document.createElement('gradient');
    const angle = ((layer.gradientAngle || 0) * Math.PI) / 180;
    const dx = Math.cos(angle) / 2;
    const dy = Math.sin(angle) / 2;
    gradient.setAttribute('type', layer.fillType);
    gradient.setAttribute('startColor', hexToArgb(layer.color));
    gradient.setAttribute('endColor', hexToArgb(layer.gradientColor));
    gradient.setAttribute('start', `${round(0.5 - dx)},${round(0.5 - dy)}`);
    gradient.setAttribute('end', `${round(0.5 + dx)},${round(0.5 + dy)}`);
    node.append(gradient);
  } else if (!['audio', 'camera', 'null', 'group'].includes(tag)) {
    const fill = document.createElement('fillColor');
    fill.setAttribute('value', hexToArgb(layer.color));
    node.append(fill);
  }
}

function appendEffectsAndStroke(
  document: XMLDocument,
  node: Element,
  layer: Layer,
): void {
  for (const property of layer.alightProperties || []) {
    appendAlightProperty(document, node, property);
  }
  if (layer.depth) {
    appendAlightProperty(document, node, {
      name: 'z',
      type: 'float',
      value: String(round(layer.depth)),
      keyframes: [],
    });
  }

  const preservedIds = new Set(
    (layer.alightEffects || []).flatMap((effect) => [effect.id, effect.sourceId]),
  );
  for (const effect of layer.alightEffects || []) {
    appendAlightEffect(document, node, effect);
  }
  for (const effect of generatedAlightEffects(layer)) {
    if (
      !preservedIds.has(effect.id) &&
      !preservedIds.has(normalizeEffectId(effect.id))
    ) {
      appendAlightEffect(document, node, effect);
    }
  }

  if (layer.stroke) {
    const stroke = document.createElement('stroke');
    appendAlightProperty(document, stroke, {
      name: 'width',
      type: 'float',
      value: String(round(layer.stroke)),
      keyframes: [],
    });
    appendAlightProperty(document, stroke, {
      name: 'color',
      type: 'color',
      value: hexToArgb(layer.strokeColor),
      keyframes: [],
    });
    node.append(stroke);
  }
}

export function exportAlightLayer(
  document: XMLDocument,
  layer: Layer,
  index: number,
  exportedId: string,
  context: LayerExportContext,
): Element {
  let tag =
    layer.type === 'text'
      ? 'text'
      : layer.type === 'audio'
        ? 'audio'
        : layer.type === 'camera'
          ? 'camera'
          : layer.type === 'null'
            ? layer.precomposition
              ? 'group'
              : 'null'
            : layer.alightTag || 'shape';
  if (!LAYER_TAGS.has(tag) || ['media', 'image', 'video', 'drawing', 'color'].includes(tag)) {
    tag = 'shape';
  }

  const media = ['image', 'video', 'audio'].includes(layer.type);
  const node = document.createElement(tag);
  node.setAttribute('id', exportedId);
  node.setAttribute('label', layer.name || `Camada ${index + 1}`);
  node.setAttribute('startTime', String(Math.round((layer.start || 0) * 1000)));
  node.setAttribute(
    'endTime',
    String(Math.round((layer.end ?? context.state.duration) * 1000)),
  );

  if (tag === 'shape') {
    node.setAttribute(
      'fillType',
      media
        ? 'media'
        : layer.fillType === 'linear' || layer.fillType === 'radial'
          ? 'gradient'
          : 'color',
    );
    node.setAttribute(
      's',
      layer.alightShape || (layer.type === 'circle' ? '.circle' : '.rect'),
    );
  }
  if (tag === 'text') {
    node.setAttribute('fillType', 'color');
    node.setAttribute('size', String(round(layer.fontSize || 42)));
    node.setAttribute(
      'font',
      `googlefonts?name=${encodeURIComponent(layer.font || 'Roboto')}&weight=400`,
    );
    node.setAttribute('align', layer.textAlign || 'center');
  }
  for (const [name, value] of Object.entries(layer.alightAttributes || {})) {
    if (!node.hasAttribute(name)) node.setAttribute(name, String(value).slice(0, 2048));
  }

  appendTransform(document, node, layer, context.state);
  appendFill(document, node, layer, tag, media, context);
  if (tag === 'text') {
    const content = document.createElement('content');
    content.textContent = layer.content || '';
    node.append(content);
  }
  if (layer.type === 'path') {
    const path = document.createElement('path');
    path.setAttribute('d', pathData(layer, context.state));
    node.append(path);
  }
  appendEffectsAndStroke(document, node, layer);

  if (layer.blend && layer.blend !== 'normal') {
    const blend = document.createElement('blendMode');
    blend.setAttribute('value', layer.blend);
    node.append(blend);
  }
  for (const raw of layer.alightExtras || []) {
    try {
      const extra = parseXmlFragment(raw);
      if (extra) node.append(document.importNode(extra, true));
    } catch {
      // Preserva a exportação mesmo quando um fragmento externo está corrompido.
    }
  }
  return node;
}
