import type {
  ExternalEffectInstance,
  Layer,
} from '../../core/project-model';
import type { AlightReport } from './alight-types';
import {
  argbToHex,
  attributesOf,
  clamp,
  directAll,
  normalizeEffectId,
  propertyData,
  propertyValue,
} from './alight-xml-utils';

export function readAlightEffect(
  layer: Layer,
  node: Element,
  report: AlightReport,
): void {
  const sourceId = String(node.getAttribute('id') || '').slice(0, 300);
  const effect: ExternalEffectInstance = {
    id: normalizeEffectId(sourceId),
    sourceId,
    locallyApplied: node.getAttribute('locallyApplied') !== 'false',
    hidden: node.getAttribute('hidden') === 'true',
    properties: directAll(node, 'property').slice(0, 500).map(propertyData),
    attributes: attributesOf(node, ['id', 'locallyApplied', 'hidden']),
    extras: [...node.children]
      .filter((child) => child.tagName !== 'property')
      .slice(0, 100)
      .map((child) =>
        new XMLSerializer().serializeToString(child).slice(0, 200_000),
      ),
  };
  layer.alightEffects!.push(effect);

  const id = effect.id.toLowerCase();
  const properties = new Map(
    effect.properties.map((property) => [property.name.toLowerCase(), property]),
  );
  const value = (names: string[], fallback = 0): number => {
    for (const name of names) {
      if (properties.has(name)) {
        return propertyValue(properties.get(name), fallback);
      }
    }
    return fallback;
  };

  let supported = true;
  if (id.includes('motionblur')) {
    layer.effects.motionBlur = clamp(value(['tune', 'strength'], 1) * 10, 0, 30);
  } else if (id.includes('blur')) {
    layer.effects.blur = clamp(value(['strength', 'radius', 'amount'], 0.15) * 100, 0, 30);
  } else if (id.includes('sharpen')) {
    layer.effects.sharpen = clamp(value(['strength', 'amount'], 1) * 50, 0, 100);
  } else if (id.includes('glow')) {
    layer.effects.glow = clamp(value(['alpha', 'strength', 'amount'], 0.75) * 100, 0, 100);
    const color = properties.get('color')?.value;
    if (color) layer.glowColor = argbToHex(color);
  } else if (id.includes('vignette')) {
    layer.effects.vignette = clamp(value(['strength', 'amount'], 0.8) * 100, 0, 100);
  } else if (id.includes('chromakey')) {
    layer.effects.chromaTolerance = clamp(
      value(['threshold', 'tolerance'], 0.1) * 100,
      0,
      100,
    );
    const color = properties.get('keycolor')?.value;
    if (color) layer.chromaColor = argbToHex(color);
  } else if (id.includes('brightcont')) {
    layer.effects.brightness = clamp(100 + value(['brightness']) * 100, 0, 250);
    layer.effects.contrast = clamp(100 + value(['contrast']) * 100, 0, 250);
  } else if (id.includes('satvib')) {
    layer.effects.saturation = clamp(100 + value(['saturation']) * 100, 0, 300);
  } else if (id.includes('hueshift')) {
    const hue = value(['hue']);
    layer.effects.hue = clamp(Math.abs(hue) <= 1 ? hue * 360 : hue, -180, 180);
  } else if (id === 'invert') {
    layer.effects.invert = 100;
  } else {
    supported = false;
  }

  if (
    !supported &&
    effect.sourceId &&
    report.unsupportedEffects instanceof Set
  ) {
    report.unsupportedEffects.add(effect.sourceId);
  }
}
