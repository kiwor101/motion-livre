<script setup lang="ts">
import BaseButton from '../base/BaseButton.vue'
</script>

<template>
  <div id="panel-text" class="panel">
    <h2>Texto</h2><p>Adicione um título editável.</p>
    <input id="textValue" value="Seu texto" maxlength="100">
    <BaseButton id="addText" class="wide">Adicionar texto</BaseButton>
  </div>
</template>
