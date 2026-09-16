import type { EditorState } from './editor-state';
import type { Layer, LayerId } from './project-model';

type VectorKind = 'mask' | 'path';
type VectorPoint = [number, number];

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

export function setVectorPoints(
  state: EditorState,
  {
    id,
    kind,
    points,
  }: { id: LayerId; kind: VectorKind; points: VectorPoint[] },
): boolean {
  const layer = editable(state, id);
  if (!layer) return false;

  const limit = kind === 'mask' ? 1000 : 10_000;
  if (points.length > limit) {
    throw new RangeError('Quantidade de pontos inválida');
  }

  const normalized = points.map((point) => {
    if (!Array.isArray(point) || point.length !== 2) {
      throw new Error('Ponto inválido');
    }
    finiteNumber(point[0], 0, 100, 'Coordenada X');
    finiteNumber(point[1], 0, 100, 'Coordenada Y');
    return [point[0], point[1]] as VectorPoint;
  });

  if (kind === 'mask') layer.maskPoints = normalized;
  else layer.pathPoints = normalized;
  return true;
}

export function appendVectorPoint(
  state: EditorState,
  {
    id,
    kind,
    point,
  }: { id: LayerId; kind: VectorKind; point: VectorPoint },
): boolean {
  const layer = editable(state, id);
  if (!layer) return false;

  const current = kind === 'mask' ? layer.maskPoints : layer.pathPoints || [];
  return setVectorPoints(state, { id, kind, points: [...current, point] });
}
