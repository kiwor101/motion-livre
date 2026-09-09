<script setup lang="ts">
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
    <button v-for="tool in tools" :key="tool.panel" class="tool" :class="{active:tool.panel==='media'}" :data-panel="tool.panel"><span>{{ tool.icon }}</span>{{ tool.label }}</button>
  </aside>
</template>
