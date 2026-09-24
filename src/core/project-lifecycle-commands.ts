import { trimClip } from './clip-commands';
import type { EditorState } from './editor-state';

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

export function resetProject(state: EditorState): boolean {
  state.layers = [];
  state.duration = 10;
  state.composition = {
    width: 1920,
    height: 1080,
    fps: 30,
    background: '#08090b',
  };
  state.renderRange = { start: 0, end: 10 };
  state.mediaLibrary = [];
  state.markers = [];
  state.beatMarkers = [];
  state.beatSync = { bpm: 120, offset: 0 };
  delete state.alightScene;

  state.selection.selected = null;
  state.selection.selectedIds.clear();
  state.playback.time = 0;
  state.playback.playing = false;
  state.playback.started = 0;
  state.playback.audio = null;
  state.playback.previewMuted = false;
  return true;
}

export function setComposition(
  state: EditorState,
  {
    width,
    height,
    fps,
    duration,
    background,
  }: {
    width: number;
    height: number;
    fps: number;
    duration: number;
    background: string;
  },
): boolean {
  finiteNumber(width, 16, 8192, 'Largura');
  finiteNumber(height, 16, 8192, 'Altura');
  finiteNumber(fps, 30, 120, 'FPS');
  finiteNumber(duration, 0.01, 600, 'Duração');

  const invalidComposition =
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    !/^#[0-9a-f]{6}$/i.test(background);
  if (invalidComposition) throw new Error('Composição inválida');
  if (state.layers.some((layer) => layer.start + 0.01 > duration)) {
    throw new Error('A duração deve incluir o início de todas as camadas');
  }

  // Calcula todos os cortes antes de substituir a configuração da composição.
  const layers = state.layers.map((layer) =>
    layer.end > duration ? trimClip(layer, 'end', duration) : layer,
  );
  const end = Math.min(state.renderRange.end, duration);

  state.composition = { ...state.composition, width, height, fps, background };
  state.duration = duration;
  layers.forEach((layer, index) => Object.assign(state.layers[index], layer));
  state.renderRange = {
    start: Math.min(state.renderRange.start, Math.max(0, end - 0.01)),
    end,
  };
  state.markers = state.markers.filter((time) => time <= duration);
  state.beatMarkers = state.beatMarkers.filter((time) => time <= duration);
  state.playback.time = Math.min(state.playback.time, duration);
  return true;
}
