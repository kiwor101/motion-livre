<template>
  <div class="custom-resolution">
    <label>Largura<input id="compositionWidth" type="number" min="64" max="7680" step="2" value="1920"></label>
    <span aria-hidden="true">×</span>
    <label>Altura<input id="compositionHeight" type="number" min="64" max="4320" step="2" value="1080"></label>
    <button id="applyResolution" type="button">Aplicar</button>
  </div>
</template>
