import type { EditorState } from './editor-state';
import type { Layer, LayerId, ProjectKeyframe } from './project-model';

const allowedProperties = new Set([
  'name',
  'x',
  'y',
  'depth',
  'perspective',
  'scale',
  'scaleX',
  'scaleY',
  'scaleLinked',
  'rotation',
  'opacity',
  'color',
  'filter',
  'anchorX',
  'anchorY',
  'cropX',
  'cropY',
  'fitMode',
  'visible',
  'locked',
  'flipX',
  'flipY',
  'blend',
  'radius',
  'stroke',
  'strokeColor',
  'font',
  'fontSize',
  'mask',
  'speed',
  'volume',
  'pan',
  'fadeIn',
  'fadeOut',
  'muted',
  'solo',
  'audioChannel',
  'easing',
  'transitionIn',
  'transitionOut',
  'transitionDuration',
  'reverse',
  'fillType',
  'gradientColor',
  'gradientAngle',
  'maskMode',
  'parentId',
  'glowColor',
  'chromaColor',
]);

const keyframeProperties = new Set([
  'x',
  'y',
  'depth',
  'scale',
  'scaleX',
  'scaleY',
  'rotation',
  'opacity',
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

export function setProperties(
  state: EditorState,
  { id, values }: { id: LayerId; values: Record<string, unknown> },
): boolean {
  const layer = state.layers.find((item) => item.id === id);
  if (!layer) return false;

  const keys = Object.keys(values || {});
  if (!keys.length) return false;
  if (layer.locked && !(keys.length === 1 && keys[0] === 'locked')) return false;

  // Valida o conjunto completo antes de alterar a camada.
  for (const key of keys) {
    const value = values[key];
    if (!allowedProperties.has(key)) {
      throw new Error(`Propriedade inválida: ${key}`);
    }

    if (
      !(key === 'parentId' && value === null) &&
      (typeof layer[key] === 'number' || typeof value === 'number')
    ) {
      finiteNumber(value, -Number.MAX_VALUE, Number.MAX_VALUE, 'Valor');
    }
    if (typeof layer[key] === 'boolean' && typeof value !== 'boolean') {
      throw new Error('Valor booleano inválido');
    }
    if (typeof layer[key] === 'string' && typeof value !== 'string') {
      throw new Error('Texto inválido');
    }
  }

  if ('speed' in values) finiteNumber(values.speed, 0.0625, 16, 'Velocidade');

  if ('parentId' in values && values.parentId !== null) {
    const parentId = values.parentId;
    if (typeof parentId !== 'number' && typeof parentId !== 'string') {
      throw new Error('Camada pai inválida');
    }

    let parent = state.layers.find((item) => item.id === parentId);
    if (!parent) throw new Error('Camada pai inválida');

    const visited = new Set<LayerId>([id]);
    while (parent) {
      if (parent.id === undefined || visited.has(parent.id)) {
        throw new Error('Parenting circular não permitido');
      }
      visited.add(parent.id);
      const ancestorId: LayerId | null = parent.parentId;
      parent =
        ancestorId === null
          ? undefined
          : state.layers.find((item) => item.id === ancestorId);
    }
  }

  Object.assign(layer, clone(values));
  return true;
}

export function setLayerEasing(
  state:EditorState,
  {id,easing}:{id:LayerId;easing:string},
):boolean {
  const layer=editable(state,id);
  if(!layer)return false;
  if(typeof easing!=='string'||!easing||easing.length>2048)throw new Error('Interpolação inválida');
  layer.easing=easing;
  layer.keyframes=layer.keyframes.map(frame=>({...clone(frame),easing,easings:frame.easings?Object.fromEntries(Object.keys(frame.easings).map(property=>[property,easing])):frame.easings}));
  return true;
}

export function setKeyframe(
  state: EditorState,
  {
    id,
    time,
    values,
    easing,
  }: {
    id: LayerId;
    time: number;
    values: Record<string, number>;
    easing?: string;
  },
): boolean {
  const layer = editable(state, id);
  if (!layer) return false;

  finiteNumber(time, 0, state.duration, 'Tempo');
  const keys = Object.keys(values || {});
  if (!keys.length) return false;

  for (const key of keys) {
    if (!keyframeProperties.has(key)) {
      throw new Error('Propriedade de keyframe inválida');
    }
    finiteNumber(values[key], -Number.MAX_VALUE, Number.MAX_VALUE, 'Valor');
  }

  const frames: ProjectKeyframe[] = layer.keyframes.flatMap((frame) => {
    if (Math.abs(frame.time - time) >= 0.02) return [clone(frame)];
    const remaining = { ...frame.values };
    for (const key of keys) delete remaining[key];
    return Object.keys(remaining).length ? [{ ...clone(frame), values: remaining }] : [];
  });

  frames.push({
    time,
    values: clone(values),
    easing: easing ?? layer.easing ?? 'linear',
  });
  layer.keyframes = frames.sort((a, b) => a.time - b.time);
  return true;
}

export function setAnimatedProperties(
  state: EditorState,
  {
    id,
    time,
    values,
  }: { id: LayerId; time: number; values: Record<string, unknown> },
): boolean {
  const layer = state.layers.find((item) => item.id === id);
  if (!layer || !setProperties(state, { id, values })) return false;

  const animatedValues: Record<string, number> = {};
  for (const [key, value] of Object.entries(values)) {
    if (
      keyframeProperties.has(key) &&
      typeof value === 'number' &&
      layer.keyframes.some((frame) => Number.isFinite(frame.values?.[key]))
    ) {
      animatedValues[key] = value;
    }
  }
  if (Object.keys(animatedValues).length) {
    setKeyframe(state, { id, time, values: animatedValues, easing: layer.easing });
  }
  return true;
}

export function moveKeyframe(
  state: EditorState,
  { id, index, time }: { id: LayerId; index: number; time: number },
): boolean {
  const layer = editable(state, id);
  if (!layer || !layer.keyframes[index]) return false;
  finiteNumber(time, 0, state.duration, 'Tempo');
  const previousTime = layer.keyframes[index].time;
  const nextTime = Math.max(layer.start, Math.min(layer.end, time));
  for (const frame of layer.keyframes) if (Math.abs(frame.time - previousTime) < 0.02) frame.time = nextTime;
  layer.keyframes.sort((left, right) => left.time - right.time);
  return true;
}
