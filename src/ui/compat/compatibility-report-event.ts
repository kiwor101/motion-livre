export const COMPATIBILITY_REPORT_EVENT = 'motion-livre:compatibility-report'

export interface CompatibilityReportPayload {
  mode: 'export' | 'import'
  layers: number
  keyframes: number
  unsupportedEffects: string[]
  unresolvedMedia: string[]
  sourceVersion: string
}

export function emitCompatibilityReport(payload: CompatibilityReportPayload): void {
  window.dispatchEvent(new CustomEvent<CompatibilityReportPayload>(COMPATIBILITY_REPORT_EVENT, {detail: payload}))
}
