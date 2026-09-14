const aliases: Record<string, string> = {
  add: 'add',
  download: 'download',
  folder: 'folder_open',
  redo: 'redo',
  save: 'save',
  undo: 'undo',
}

export function resolveIcon(name: string): string {
  return aliases[name] ?? name.replaceAll('-', '_')
}
