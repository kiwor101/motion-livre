import type { EditorState } from './editor-state';
import {
  EFFECT_DEFAULTS,
  type Layer,
  type LayerId,
} from './project-model';

export const effectOrderKeys = new Set(['rgb', ...Object.keys(EFFECT_DEFAULTS)]);

const effectRanges: Record<string, readonly [number, number]> = {
  brightness: [0, 250],
  contrast: [0, 250],
  saturation: [0, 300],
  hue: [-180, 180],
  blur: [0, 30],
  grayscale: [0, 100],
  sepia: [0, 100],
  invert: [0, 100],
  glow: [0, 100],
  vignette: [0, 100],
  sharpen: [0, 100],
  chromaTolerance: [0, 100],
  motionBlur: [0, 30],
  redGain: [0, 200],
  greenGain: [0, 200],
  blueGain: [0, 200],
};

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

export function setEffects(
  state: EditorState,
  {
    id,
    values,
    replace = false,
  }: {
    id: LayerId;
    values: Record<string, number>;
    replace?: boolean;
  },
): boolean {
  const layer = editable(state, id);
  if (!layer) return false;

  const keys = Object.keys(values);
  if (!keys.length && !replace) return false;

  for (const key of keys) {
    if (!(key in EFFECT_DEFAULTS)) throw new Error(`Efeito inválido: ${key}`);
    const [min, max] = effectRanges[key];
    finiteNumber(values[key], min, max, 'Valor do efeito');
  }

  layer.effects = replace
    ? { ...EFFECT_DEFAULTS, ...clone(values) }
    : { ...layer.effects, ...clone(values) };
  return true;
}

export function resetEffect(
  state: EditorState,
  { id, key }: { id: LayerId; key: string },
): boolean {
  if (key === 'rgb') {
    return setEffects(state, {
      id,
      values: {
        redGain: EFFECT_DEFAULTS.redGain,
        greenGain: EFFECT_DEFAULTS.greenGain,
        blueGain: EFFECT_DEFAULTS.blueGain,
      },
    });
  }
  if (!(key in EFFECT_DEFAULTS)) throw new Error(`Efeito inválido: ${key}`);
  return setEffects(state, { id, values: { [key]: EFFECT_DEFAULTS[key] } });
}
