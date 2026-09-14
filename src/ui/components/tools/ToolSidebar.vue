<script setup lang="ts">
import ToolButton from './ToolButton.vue'

const tools=[
  {panel:'media',icon:'▣',label:'Mídia'},
  {panel:'text',icon:'T',label:'Texto'},
  {panel:'shape',icon:'◆',label:'Forma'},
  {panel:'draw',icon:'✎',label:'Desenho'},
  {panel:'effects',icon:'✦',label:'Efeitos'},
  {panel:'cut',icon:'✂',label:'Corte'},
  {panel:'audio',icon:'♫',label:'Áudio'},
  {panel:'animation',icon:'◆',label:'Animação'},
  {panel:'project',icon:'⚙',label:'Projeto'}
];
</script>

<template>
  <aside class="tools">
    <ToolButton
      v-for="tool in tools"
      :key="tool.panel"
      v-bind="tool"
      :active="tool.panel === 'media'"
    />
  </aside>
</template>
