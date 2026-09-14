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

<style scoped>
.beat-sync-panel {
  position: fixed;
  z-index: 1000;
  width: 230px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--panel2);
  box-shadow: 0 12px 35px #000a;
}

strong,
label,
small {
  display: block;
  margin-bottom: 8px;
}

label {
  color: var(--muted);
  font-size: 10px;
}

input {
  box-sizing: border-box;
  width: 100%;
}

button {
  display: block;
  width: 100%;
  margin-top: 4px;
  padding: 7px 9px;
  border: 0;
  border-radius: 5px;
  background: var(--panel);
  color: var(--text);
  text-align: left;
}

small {
  margin-top: 9px;
  color: var(--muted);
  line-height: 1.4;
}
</style>
