import type { EditorState } from './editor-state';
import {
  createLayer,
  type Layer,
  type LayerId,
  type TrackId,
} from './project-model';

function editable(state: EditorState, id: LayerId): Layer | null {
  const layer = state.layers.find((item) => item.id === id);
  return layer && !layer.locked ? layer : null;
}

export function createControlLayer(
  state: EditorState,
  {
    id,
    kind,
    name,
    trackId = `track-${id}`,
  }: {
    id: LayerId;
    kind: 'null' | 'camera';
    name: string;
    trackId?: TrackId;
  },
): Layer | null {
  const validTrackId =
    typeof trackId === 'number'
      ? Number.isSafeInteger(trackId)
      : typeof trackId === 'string' && Boolean(trackId.trim());
  const invalid =
    !Number.isSafeInteger(id) ||
    id < 1 ||
    state.layers.some((layer) => layer.id === id) ||
    typeof name !== 'string' ||
    !name.trim() ||
    !validTrackId;
  if (invalid) throw new Error('Controle inválido');

  const lockedCamera =
    kind === 'camera' &&
    state.layers.some(
      (layer) => layer.type === 'camera' && layer.visible && layer.locked,
    );
  if (lockedCamera) return null;

  const layer = createLayer({
    id,
    type: kind,
    name: name.trim(),
    duration: state.duration,
  });
  layer.trackId = trackId;
  layer.trackName = layer.name;

  if (kind === 'camera') {
    for (const camera of state.layers) {
      if (camera.type === 'camera') camera.visible = false;
    }
  }

  state.layers.push(layer);
  state.selection.selected = id;
  state.selection.selectedIds.clear();
  return layer;
}

export function toggleGroup(
  state: EditorState,
  { id, name }: { id: LayerId; name: string },
): boolean {
  const layer = editable(state, id);
  if (!layer) return false;

  if (layer.group) {
    layer.group = null;
    layer.name = layer.name.replace(/^Grupo \d+ · /, '');
  } else {
    layer.group = name;
    layer.name = `${name} · ${layer.name}`;
  }
  return true;
}

export function precompose(
  state: EditorState,
  { controllerId, childIds }: { controllerId: LayerId; childIds: LayerId[] },
): boolean {
  const controller = editable(state, controllerId);
  const children = state.layers.filter(
    (layer) =>
      layer.id !== controllerId &&
      layer.id !== undefined &&
      childIds.includes(layer.id),
  );
  if (
    !controller ||
    controller.type !== 'null' ||
    children.length < 2 ||
    children.some((layer) => layer.locked)
  ) {
    return false;
  }

  const centerX =
    children.reduce((sum, layer) => sum + layer.x, 0) / children.length;
  const centerY =
    children.reduce((sum, layer) => sum + layer.y, 0) / children.length;
  Object.assign(controller, {
    x: centerX,
    y: centerY,
    start: Math.min(...children.map((layer) => layer.start)),
    end: Math.max(...children.map((layer) => layer.end)),
    precomposition: true,
  });

  for (const child of children) {
    child.x = 50 + (child.x - centerX);
    child.y = 50 + (child.y - centerY);
    child.parentId = controllerId;
    child.precompGroup = controller.name;
  }

  state.selection.selectedIds.clear();
  state.selection.selected = controllerId;
  return true;
}
