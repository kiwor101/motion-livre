<template>
  <div class="floating-dropdown beat-sync-panel" hidden>
    <strong>Beat sync</strong>
    <label>BPM <input data-beat-bpm type="number" min="30" max="300" step="0.01" value="120"></label>
    <label>Início (s) <input data-beat-offset type="number" min="0" step="0.001" value="0"></label>
    <button type="button" data-beat-analyze>Estimar pela waveform</button>
    <button type="button" data-beat-generate>Gerar grade</button>
    <button type="button" data-beat-clear>Remover beat sync</button>
    <small>A análise detecta ataques recorrentes e calcula o BPM e a fase da grade.</small>
  </div>
</template>
