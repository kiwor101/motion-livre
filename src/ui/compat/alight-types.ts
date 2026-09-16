export interface AlightReport {
  layers: number;
  keyframes: number;
  unsupportedEffects: Set<string> | string[];
  unresolvedMedia: string[];
  sourceVersion: string;
}
