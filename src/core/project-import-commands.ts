import type {
  AlightSceneMetadata,
  Composition,
  EditorState,
} from './editor-state';
import {
  validateAttributes,
  validateExternalEffects,
} from './external-effect-validation';
import {
  normalizeLayer,
  type Layer,
  type LayerId,
} from './project-model';
import { projectFrameRate } from './frame-rate';

export interface ImportedProject {
  duration: number;
  composition: Composition;
  layers: Layer[];
  markers?: number[];
  alightScene?: AlightSceneMetadata;
}

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

function normalizeImportedLayers(project: ImportedProject): Layer[] {
  if (!Array.isArray(project.layers) || project.layers.length > 5000) {
    throw new Error('Quantidade de camadas importadas inválida');
  }

  const ids = new Set<LayerId>();
  const layers = project.layers.map((source) => {
    if (
      !source ||
      typeof source !== 'object' ||
      typeof source.id !== 'number' ||
      !Number.isSafeInteger(source.id) ||
      source.id < 1 ||
      ids.has(source.id)
    ) {
      throw new Error('ID de camada importada inválido ou duplicado');
    }

    if (Array.isArray(source.keyframes) && source.keyframes.length > 10_000) {
      throw new Error('Quantidade de keyframes importados inválida');
    }

    ids.add(source.id);
    const layer = normalizeLayer(clone(source), project.duration);
    finiteNumber(layer.start, 0, project.duration, 'Início da camada');
    finiteNumber(layer.end, layer.start + 0.001, project.duration, 'Fim da camada');
    validateExternalEffects(layer.alightEffects);

    if (layer.trackId === undefined) layer.trackId = `track-${layer.id}`;
    if (layer.trackName === undefined) layer.trackName = layer.name;
    return layer;
  });

  for (const layer of layers) {
    if (layer.parentId !== null && !ids.has(layer.parentId)) {
      throw new Error('Parenting importado inválido');
    }
  }

  return layers;
}

function normalizeMarkers(project: ImportedProject): number[] {
  return [
    ...new Set(
      (project.markers || []).map((time) => {
        finiteNumber(time, 0, project.duration, 'Marcador importado');
        return +time.toFixed(4);
      }),
    ),
  ]
    .sort((a, b) => a - b)
    .slice(0, 10_000);
}

export function applyImportedProject(
  state: EditorState,
  { project }: { project: ImportedProject },
): boolean {
  finiteNumber(project.duration, 0.05, 3600, 'Duração importada');

  const composition = clone(project.composition);
  finiteNumber(composition.width, 64, 7680, 'Largura importada');
  finiteNumber(composition.height, 64, 7680, 'Altura importada');
  finiteNumber(composition.fps, 1, 240, 'FPS importado');
  composition.fps = projectFrameRate(composition.fps);

  const invalidComposition =
    !Number.isInteger(composition.width) ||
    !Number.isInteger(composition.height) ||
    typeof composition.background !== 'string' ||
    !/^#[0-9a-f]{6}$/i.test(composition.background);
  if (invalidComposition) throw new Error('Composição importada inválida');

  const layers = normalizeImportedLayers(project);
  const markers = normalizeMarkers(project);
  if (project.alightScene) {
    validateAttributes(project.alightScene.attributes, 'Atributos da cena');
  }

  // O estado só é substituído depois que todo o projeto foi validado.
  state.layers = layers;
  state.duration = project.duration;
  state.composition = composition;
  state.markers = markers;
  state.beatMarkers = [];
  state.beatSync = { bpm: 120, offset: 0 };
  state.renderRange = { start: 0, end: project.duration };
  state.mediaLibrary = [];

  if (project.alightScene) state.alightScene = clone(project.alightScene);
  else delete state.alightScene;

  state.selection.selected = null;
  state.selection.selectedIds.clear();
  state.playback.time = 0;
  state.playback.playing = false;
  return true;
}
