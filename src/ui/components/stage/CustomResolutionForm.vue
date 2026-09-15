<template>
  <div class="custom-resolution">
    <label>Largura<input id="compositionWidth" type="number" min="64" max="7680" step="2" value="1920"></label>
    <span aria-hidden="true">×</span>
    <label>Altura<input id="compositionHeight" type="number" min="64" max="4320" step="2" value="1080"></label>
    <button id="applyResolution" type="button">Aplicar</button>
  </div>
</template>

<style scoped>
.custom-resolution { display: grid; grid-template-columns: 1fr auto 1fr; align-items: end; gap: 7px; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--line); }
.custom-resolution label { display: grid; gap: 4px; color: var(--muted); font-size: 10px; }
.custom-resolution input { width: 100%; min-width: 0; }
.custom-resolution > span { padding-bottom: 7px; color: var(--muted); }
#applyResolution { grid-column: 1 / -1; padding: 8px; border-color: var(--accent); border-radius: 7px; background: var(--accent); color: var(--text); }
</style>
