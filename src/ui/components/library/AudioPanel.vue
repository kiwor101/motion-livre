<script setup lang="ts">
import BaseButton from '../base/BaseButton.vue'
import AudioMixer from './AudioMixer.vue'
import UploadField from '../base/UploadField.vue'
</script>

<template>
  <div id="panel-audio" class="panel">
    <h2>Mixer de áudio</h2><p>Cada arquivo vira um canal independente.</p>
    <UploadField label="+ Importar áudio" input-id="audioInput" accept="audio/*" />
    <AudioMixer />
    <BaseButton id="detachAudio" class="wide">Separar áudio do vídeo</BaseButton>
    <audio id="audioPreview"></audio>
  </div>
</template>
