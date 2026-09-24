import type { EditorState } from './editor-state';
import { effectOrderKeys, setEffects } from './layer-effect-commands';
import { setProperties } from './layer-property-commands';
import { setVectorPoints } from './layer-vector-commands';
import type { Layer, LayerId } from './project-model';

export interface LayerPreset {
  effects?: Record<string, number>;
  effectOrder?: string[];
  properties?: Record<string, unknown>;
  maskPoints?: Array<[number, number]>;
}

const presetNumberRanges: Record<string, readonly [number, number]> = {
  opacity: [0, 100],
  radius: [0, 100],
  stroke: [0, 20],
  cropX: [0, 49],
  cropY: [0, 49],
  gradientAngle: [0, 360],
  transitionDuration: [0.1, 10],
};

const presetChoices: Record<string, readonly string[]> = {
  blend: ['normal', 'multiply', 'screen', 'overlay', 'lighten', 'darken', 'difference'],
  fitMode: ['contain', 'cover', 'fill'],
  fillType: ['solid', 'linear', 'radial'],
  maskMode: ['none', 'inset', 'circle', 'ellipse', 'polygon'],
  transitionIn: ['none', 'fade', 'slide-left', 'slide-right', 'zoom'],
  transitionOut: ['none', 'fade', 'slide-left', 'slide-right', 'zoom'],
};

const presetColors = new Set([
  'glowColor',
  'chromaColor',
  'strokeColor',
  'gradientColor',
]);

function clone<T>(value: T): T {
  return structuredClone(value);
}

function finiteNumber(
  value: unknown,
  min: number,
  max: number,
  label: string,
): asserts value is number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < min ||
    value > max
  ) {
    throw new RangeError(`${label} inválido`);
  }
}

function editable(state: EditorState, id: LayerId): Layer | null {
  const layer = state.layers.find((item) => item.id === id);
  return layer && !layer.locked ? layer : null;
}

function validatePresetProperties(properties: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(properties)) {
    if (presetNumberRanges[key]) {
      const [min, max] = presetNumberRanges[key];
      finiteNumber(value, min, max, 'Valor do preset');
    } else if (presetChoices[key]) {
      if (typeof value !== 'string' || !presetChoices[key].includes(value)) {
        throw new Error(`Opção de preset inválida: ${key}`);
      }
    } else if (presetColors.has(key)) {
      if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value)) {
        throw new Error(`Cor de preset inválida: ${key}`);
      }
    } else if ((key === 'flipX' || key === 'flipY') && typeof value === 'boolean') {
      continue;
    } else {
      throw new Error(`Propriedade de preset inválida: ${key}`);
    }
  }
}

function validateEffectOrder(effectOrder: string[]): void {
  const invalid =
    !Array.isArray(effectOrder) ||
    effectOrder.some((key) => typeof key !== 'string' || !effectOrderKeys.has(key)) ||
    new Set(effectOrder).size !== effectOrder.length;
  if (invalid) throw new Error('Ordem de efeitos inválida');
}

export function applyLayerPreset(
  state: EditorState,
  { id, preset }: { id: LayerId; preset: LayerPreset },
): boolean {
  const layer = editable(state, id);
  if (!layer) return false;

  const hasChanges =
    preset.effects !== undefined ||
    preset.properties !== undefined ||
    preset.effectOrder !== undefined ||
    preset.maskPoints !== undefined;
  if (!hasChanges) return false;

  // O clone mantém a aplicação atômica quando qualquer parte do preset é inválida.
  const candidate = clone(layer);
  const shadow = {
    ...state,
    layers: state.layers.map((item) => (item === layer ? candidate : item)),
  } as EditorState;

  if (preset.effects !== undefined) {
    setEffects(shadow, { id, values: preset.effects, replace: true });
  }
  if (preset.properties !== undefined) {
    validatePresetProperties(preset.properties);
    setProperties(shadow, { id, values: preset.properties });
  }
  if (preset.effectOrder !== undefined) {
    validateEffectOrder(preset.effectOrder);
    candidate.effectOrder = [...preset.effectOrder];
  }
  if (preset.maskPoints !== undefined) {
    setVectorPoints(shadow, { id, kind: 'mask', points: preset.maskPoints });
  }

  Object.assign(layer, candidate);
  return true;
}

export function moveEffect(
  state: EditorState,
  {
    id,
    key,
    direction,
  }: { id: LayerId; key: string; direction: number },
): boolean {
  const layer = editable(state, id);
  const step = Math.sign(direction);
  if (!layer || !effectOrderKeys.has(key) || !step) return false;

  const order = [...layer.effectOrder];
  const index = order.indexOf(key);
  const target = index + step;
  if (index < 0 || target < 0 || target >= order.length) return false;

  [order[index], order[target]] = [order[target], order[index]];
  return applyLayerPreset(state, { id, preset: { effectOrder: order } });
}
