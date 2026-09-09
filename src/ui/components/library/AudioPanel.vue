<template>
  <div id="panel-audio" class="panel">
    <h2>Mixer de áudio</h2><p>Cada arquivo vira um canal independente.</p>
    <label class="upload">+ Importar áudio<input id="audioInput" type="file" accept="audio/*"></label>
    <div id="audioMixer" class="asset-list"><div class="empty">Importe áudio ou um vídeo com som</div></div>
    <button id="detachAudio" class="wide">Separar áudio do vídeo</button>
    <audio id="audioPreview"></audio>
  </div>
</template>
