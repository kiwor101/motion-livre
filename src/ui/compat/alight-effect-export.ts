import type {
  ExternalEffectInstance,
  ExternalEffectProperty,
  Layer,
} from '../../core/project-model';
import {
  DEFAULT_EFFECTS,
  hexToArgb,
  parseXmlFragment,
  round,
} from './alight-xml-utils';

type GeneratedProperty = readonly [string, string | number];
type GeneratedEffect = Omit<ExternalEffectInstance, 'sourceId' | 'hidden'> & {
  sourceId?: string;
  hidden?: boolean;
};

function copyAttributes(node: Element, attributes: Record<string, string> | undefined): void {
  for (const [name, value] of Object.entries(attributes || {})) {
    if (!node.hasAttribute(name)) node.setAttribute(name, String(value).slice(0, 2048));
  }
}

export function appendAlightProperty(
  document: XMLDocument,
  parent: Element,
  property: ExternalEffectProperty,
): void {
  if (!property?.name) return;

  const node = document.createElement('property');
  node.setAttribute('name', property.name);
  node.setAttribute('type', property.type || 'float');
  copyAttributes(node, property.attributes);

  if (property.value !== null && property.value !== undefined) {
    node.setAttribute('value', String(property.value));
  } else {
    for (const keyframe of property.keyframes || []) {
      const frame = document.createElement('kf');
      frame.setAttribute(
        't',
        String(Number.isFinite(Number(keyframe.time)) ? keyframe.time : 0),
      );
      frame.setAttribute('v', String(keyframe.value ?? ''));
      if (keyframe.easing && keyframe.easing !== 'linear') {
        frame.setAttribute('e', keyframe.easing);
      }
      copyAttributes(frame, keyframe.attributes);
      node.append(frame);
    }
  }

  if (node.hasAttribute('value') || node.children.length) parent.append(node);
}

export function appendAlightEffect(
  document: XMLDocument,
  parent: Element,
  effect: ExternalEffectInstance | GeneratedEffect,
): void {
  if (!effect?.id) return;

  const node = document.createElement('effect');
  const sourceId =
    effect.sourceId ||
    (/^com\./i.test(effect.id)
      ? effect.id
      : `com.alightcreative.effects.${effect.id}`);
  node.setAttribute('id', sourceId);
  node.setAttribute('locallyApplied', effect.locallyApplied === false ? 'false' : 'true');
  if (effect.hidden) node.setAttribute('hidden', 'true');
  copyAttributes(node, effect.attributes);

  for (const property of effect.properties || []) {
    appendAlightProperty(document, node, property);
  }
  for (const raw of effect.extras || []) {
    try {
      const extra = parseXmlFragment(raw);
      if (extra) node.append(document.importNode(extra, true));
    } catch {
      // Fragmentos externos inválidos não impedem a exportação da camada.
    }
  }
  parent.append(node);
}

export function generatedAlightEffects(layer: Layer): GeneratedEffect[] {
  const effects = { ...DEFAULT_EFFECTS, ...layer.effects };
  const generated: GeneratedEffect[] = [];
  const add = (
    id: string,
    properties: Record<string, GeneratedProperty>,
  ): void => {
    generated.push({
      id,
      locallyApplied: true,
      properties: Object.entries(properties).map(([name, [type, value]]) => ({
        name,
        type,
        value: String(value),
        keyframes: [],
      })),
    });
  };

  if (effects.brightness !== 100 || effects.contrast !== 100) {
    add('com.alightcreative.effects.brightcont', {
      brightness: ['float', round((effects.brightness - 100) / 100)],
      contrast: ['float', round((effects.contrast - 100) / 100)],
    });
  }
  if (effects.saturation !== 100) {
    add('com.alightcreative.effects.satvib', {
      saturation: ['float', round((effects.saturation - 100) / 100)],
      vib: ['float', 1],
    });
  }
  if (effects.hue) {
    add('com.alightcreative.effects.hueshift', {
      hue: ['float', round(effects.hue / 360)],
    });
  }
  if (effects.blur) {
    add('com.alightcreative.effects.gaussianblur', {
      strength: ['float', round(effects.blur / 100)],
    });
  }
  if (effects.sharpen) {
    add('com.alightcreative.effects.sharpen', {
      strength: ['float', round(effects.sharpen / 50)],
      radius: ['float', 1],
    });
  }
  if (effects.motionBlur) {
    add('com.alightcreative.effects.motionblur', {
      tune: ['float', round(effects.motionBlur / 10)],
      usePos: ['bool', 1],
      useScale: ['bool', 1],
      useAngle: ['bool', 1],
    });
  }
  if (effects.glow) {
    add('com.alightcreative.glow', {
      radius: ['float', 100],
      alpha: ['float', round(effects.glow / 100)],
      hardness: ['float', 0.5],
      color: ['color', hexToArgb(layer.glowColor || '#ffffff')],
      blendMode: ['int', 2],
    });
  }
  if (effects.vignette) {
    add('com.alightcreative.effects.vignette', {
      scale: ['float', 0.95],
      roundness: ['float', 1.5],
      feather: ['float', 0.5],
      strength: ['float', round(effects.vignette / 100)],
      tint: ['float', 0.2],
      overlaycolor: ['color', '#FF000000'],
      punchout: ['bool', 0],
    });
  }
  if (effects.chromaTolerance) {
    add('com.alightcreative.effects.chromakey', {
      keyColor: ['color', hexToArgb(layer.chromaColor || '#00ff00')],
      threshold: ['float', round(effects.chromaTolerance / 100)],
      feather: ['float', 0.05],
      defringe: ['bool', 0],
      invert: ['bool', 0],
    });
  }
  if (effects.invert) {
    add('com.alightcreative.effects.invert', {
      invertRed: ['bool', 1],
      invertGreen: ['bool', 1],
      invertBlue: ['bool', 1],
    });
  }

  return generated;
}
