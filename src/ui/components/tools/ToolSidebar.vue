<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import ToolButton from './ToolButton.vue'

const tools = [
  { panel: 'media', icon: 'folder_open', label: 'Mídia' },
  { panel: 'text', icon: 'text_fields', label: 'Texto' },
  { panel: 'shape', icon: 'shapes', label: 'Forma' },
  { panel: 'draw', icon: 'draw', label: 'Desenho' },
  { panel: 'effects', icon: 'auto_awesome', label: 'Efeitos' },
  { panel: 'cut', icon: 'content_cut', label: 'Corte' },
  { panel: 'audio', icon: 'music_note', label: 'Áudio' },
  { panel: 'animation', icon: 'animation', label: 'Animação' },
  { panel: 'project', icon: 'tune', label: 'Projeto' },
]
const activePanel = ref('media')
function syncPanel(event: Event) {
  activePanel.value = (event as CustomEvent<string>).detail
}
function selectPanel(panel: string) {
  window.dispatchEvent(new CustomEvent('motion:select-panel', { detail: panel }))
}
onMounted(() => window.addEventListener('motion:panel-change', syncPanel))
onBeforeUnmount(() => window.removeEventListener('motion:panel-change', syncPanel))
</script>

<template>
  <aside class="tools" aria-label="Ferramentas">
    <ToolButton
      v-for="tool in tools"
      :key="tool.panel"
      v-bind="tool"
      :active="tool.panel === activePanel"
      @select="selectPanel"
    />
  </aside>
</template>
