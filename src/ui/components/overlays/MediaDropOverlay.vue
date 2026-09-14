<template>
  <div id="mediaDropOverlay" class="media-drop-overlay">
    <strong>Solte para importar ao projeto</strong>
    <span>Vídeos, imagens e áudios serão adicionados como novas camadas</span>
  </div>
</template>

<style scoped>
.media-drop-overlay {
  position: fixed;
  inset: 76px 18px 202px;
  z-index: 1000;
  display: grid;
  place-content: center;
  gap: 8px;
  border: 3px dashed #a58fff;
  border-radius: 18px;
  background: rgb(18 14 35 / 90%);
  color: var(--text);
  text-align: center;
  opacity: 0;
  visibility: hidden;
  transform: scale(0.985);
  transition: opacity 120ms ease, transform 120ms ease, visibility 120ms;
  pointer-events: none;
}

strong {
  font-size: 22px;
}

span {
  color: #c9c1ef;
}

:global(body.media-dragging) .media-drop-overlay {
  opacity: 1;
  visibility: visible;
  transform: scale(1);
}
</style>
