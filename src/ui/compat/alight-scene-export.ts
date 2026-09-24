import type { EditorState } from '../../core/editor-state';
import { alightMediaInfo, exportAlightLayer } from './alight-layer-export';
import type { AlightReport } from './alight-types';
import { DEFAULT_EFFECTS, hexToArgb } from './alight-xml-utils';

export interface AlightSceneExportResult {
  xml: string;
  report: AlightReport;
}

interface AlightSceneExportOptions {
  state: EditorState;
  title: string;
  fileUri(path: string | undefined): string;
}

function configureSceneRoot(
  root: Element,
  state: EditorState,
  title: string,
): void {
  for (const [name, value] of Object.entries(state.alightScene?.attributes || {})) {
    root.setAttribute(name, String(value).slice(0, 2048));
  }

  root.setAttribute('title', title || 'Projeto Motion Livre');
  root.setAttribute('width', String(state.composition.width));
  root.setAttribute('height', String(state.composition.height));
  root.setAttribute('exportWidth', String(state.composition.width));
  root.setAttribute('exportHeight', String(state.composition.height));
  root.setAttribute('bgcolor', hexToArgb(state.composition.background));
  root.setAttribute('totalTime', String(Math.round(state.duration * 1000)));
  root.setAttribute('fps', String(state.composition.fps));
  root.setAttribute('modifiedTime', String(Date.now()));

  if (!root.hasAttribute('amver')) root.setAttribute('amver', '106');
  if (!root.hasAttribute('ffver')) root.setAttribute('ffver', '101');
  if (!root.hasAttribute('am')) {
    root.setAttribute('am', 'org.motionlivre.editor/0.0.0.1');
  }
  if (!root.hasAttribute('amplatform')) root.setAttribute('amplatform', 'android');
}

function appendMediaCatalog(
  document: XMLDocument,
  root: Element,
  state: EditorState,
  fileUri: (path: string | undefined) => string,
): void {
  const mediaUris = new Set<string>();
  const mediaLayers = state.layers.filter((layer) =>
    ['image', 'video', 'audio'].includes(layer.type),
  );

  for (const layer of mediaLayers) {
    const info = alightMediaInfo(layer, fileUri);
    if (!info.uri || mediaUris.has(info.uri)) continue;

    mediaUris.add(info.uri);
    const media = document.createElement('media');
    media.setAttribute('uri', info.uri);
    media.setAttribute('filename', info.filename);
    media.setAttribute('title', layer.name || info.filename);
    media.setAttribute('type', info.mime);
    root.append(media);
  }
}

function appendBookmarks(
  document: XMLDocument,
  root: Element,
  markers: number[],
): void {
  for (const marker of markers) {
    const bookmark = document.createElement('bookmark');
    bookmark.setAttribute('t', String(Math.round(marker * 1000)));
    root.append(bookmark);
  }
}

function uniqueExportIds(state: EditorState): string[] {
  const usedIds = new Set<string>();
  return state.layers.map((layer, index) => {
    let value = String(layer.alightId || index + 1);
    if (!value || usedIds.has(value)) {
      let suffix = index + 1;
      while (usedIds.has(String(suffix))) suffix += 1;
      value = String(suffix);
    }
    usedIds.add(value);
    return value;
  });
}

function appendLayers(
  document: XMLDocument,
  root: Element,
  options: AlightSceneExportOptions,
): void {
  const { state, fileUri } = options;
  const exportIds = uniqueExportIds(state);
  const exported = state.layers.map((layer, index) =>
    exportAlightLayer(document, layer, index, exportIds[index], {
      state,
      fileUri,
    }),
  );

  // Usa o índice original para não deslocar o parenting quando uma camada não tem ID.
  const byId = new Map(
    state.layers.flatMap((layer, index) =>
      layer.id === undefined ? [] : [[layer.id, exported[index]] as const],
    ),
  );

  state.layers.forEach((layer, index) => {
    const parent = layer.parentId === null ? undefined : byId.get(layer.parentId);
    if (parent?.tagName === 'group') parent.append(exported[index]);
    else root.append(exported[index]);
  });
}

function compatibilityReport(state: EditorState): AlightReport {
  const unsupportedEffects = state.layers.flatMap((layer) => {
    const effects = { ...DEFAULT_EFFECTS, ...layer.effects };
    return [
      ['grayscale', effects.grayscale],
      ['sepia', effects.sepia],
      [
        'RGB personalizado',
        effects.redGain !== 100 ||
          effects.greenGain !== 100 ||
          effects.blueGain !== 100,
      ],
    ]
      .filter(([, active]) => active)
      .map(([name]) => `${layer.name}: ${name}`);
  });

  return {
    layers: state.layers.length,
    keyframes: state.layers.reduce(
      (sum, layer) => sum + (layer.keyframes?.length || 0),
      0,
    ),
    unsupportedEffects,
    unresolvedMedia: state.layers
      .filter(
        (layer) =>
          ['image', 'video', 'audio'].includes(layer.type) && !layer.sourcePath,
      )
      .map((layer) => layer.name),
    sourceVersion: '106',
  };
}

export function exportAlightScene(
  options: AlightSceneExportOptions,
): AlightSceneExportResult {
  const document = window.document.implementation.createDocument('', 'scene');
  const root = document.documentElement;

  configureSceneRoot(root, options.state, options.title);
  appendMediaCatalog(document, root, options.state, options.fileUri);
  appendBookmarks(document, root, options.state.markers || []);
  appendLayers(document, root, options);

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    new XMLSerializer().serializeToString(document).replace(/></g, '>\n<') +
    '\n';
  return { xml, report: compatibilityReport(options.state) };
}
