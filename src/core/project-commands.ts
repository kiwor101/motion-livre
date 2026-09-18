// Fachada estável para os consumidores enquanto os comandos evoluem por domínio.
export { resetEffect, setEffects } from './layer-effect-commands';
export {
  createControlLayer,
  precompose,
  toggleGroup,
} from './layer-hierarchy-commands';
export { applyImportedProject, type ImportedProject } from './project-import-commands';
export { applyLayerPreset, moveEffect, type LayerPreset } from './layer-preset-commands';
export { moveKeyframe, setAnimatedProperties, setKeyframe, setProperties } from './layer-property-commands';
export { resetTrim, trim } from './layer-trim-commands';
export { appendVectorPoint, setVectorPoints } from './layer-vector-commands';
export { setLayerWaveform } from './media-commands';
export { resetProject, setComposition } from './project-lifecycle-commands';
export {
  addMarker,
  extendDurationTo,
  generateBeats,
  moveMarker,
  removeMarker,
  setMarkers,
  setRange,
  setRenderRange,
  trimEmpty,
} from './timeline-commands';
