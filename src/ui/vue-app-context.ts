import type {AppContext} from 'vue'

let uiAppContext: AppContext | null = null

export function setUiAppContext(context: AppContext): void { uiAppContext = context }
export function getUiAppContext(): AppContext {
  if (!uiAppContext) throw new Error('Aplicação Vue ainda não foi montada')
  return uiAppContext
}
