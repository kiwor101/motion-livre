import { trimClip } from './clip-commands';
import type { EditorState } from './editor-state';
import type { Layer, LayerId } from './project-model';

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

export function trim(
  state: EditorState,
  {
    id,
    edge,
    time,
  }: { id: LayerId; edge: 'start' | 'end'; time: number },
): boolean {
  if (edge !== 'start' && edge !== 'end') {
    throw new Error('Borda de corte inválida');
  }

  const layer = editable(state, id);
  if (!layer) return false;
  finiteNumber(time, 0, state.duration, 'Tempo');

  const invalidTime =
    time < layer.start ||
    time > layer.end ||
    (edge === 'start' && time >= layer.end - 0.01) ||
    (edge === 'end' && time <= layer.start + 0.01);
  if (invalidTime) return false;

  Object.assign(layer, trimClip(layer, edge, time));
  return true;
}

export function resetTrim(
  state: EditorState,
  { id }: { id: LayerId },
): boolean {
  const layer = editable(state, id);
  if (!layer) return false;

  const sourceOut = layer.mediaDuration || state.duration;
  Object.assign(layer, {
    start: 0,
    sourceIn: 0,
    sourceOut,
    end: Math.min(state.duration, sourceOut / (layer.speed || 1)),
  });
  return true;
}
