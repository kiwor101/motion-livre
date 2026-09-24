<script setup lang="ts">
import BaseButton from '../base/BaseButton.vue'
import TextField from '../base/TextField.vue'
</script>

<template>
  <div id="panel-text" class="panel">
    <h2>Texto</h2><p>Adicione um título editável.</p>
    <TextField label="Conteúdo" input-id="textValue" value="Seu texto" :max-length="100" />
    <BaseButton id="addText" class="wide">Adicionar texto</BaseButton>
  </div>
</template>
