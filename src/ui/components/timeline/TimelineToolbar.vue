<script setup lang="ts">
import AppIcon from '../base/AppIcon.vue'

interface Action {
  key: string
  icon: string
  label: string
  pressed?: boolean
}

const editActions: Action[] = [
  { key: 'split', icon: 'content-cut', label: 'Dividir no cursor' },
  { key: 'duplicate', icon: 'content-copy', label: 'Duplicar em camada acima' },
  { key: 'up', icon: 'arrow-upward', label: 'Mover para cima' },
  { key: 'down', icon: 'arrow-downward', label: 'Mover para baixo' },
  { key: 'delete', icon: 'delete', label: 'Excluir clipe' },
]

const clipActions: Action[] = [
  { key: 'freeze', icon: 'ac-unit', label: 'Congelar quadro' },
  { key: 'reverse', icon: 'replay', label: 'Reproduzir ao contrário', pressed: false },
  { key: 'flip', icon: 'flip', label: 'Espelhar horizontalmente', pressed: false },
  { key: 'extract-audio', icon: 'music-note', label: 'Extrair o áudio do vídeo selecionado' },
]

const rangeActions: Action[] = [
  { key: 'range-in', icon: 'first-page', label: 'Marcar início da renderização' },
  { key: 'range-out', icon: 'last-page', label: 'Marcar fim da renderização' },
  { key: 'trim-start', icon: 'align-horizontal-left', label: 'Remover o espaço antes do primeiro clipe' },
  { key: 'trim-end', icon: 'align-horizontal-right', label: 'Remover o espaço depois do último clipe' },
]
</script>

<template>
  <div class="timeline-controls">
    <div class="timeline-edit-tools">
      <div class="timeline-tool-group edit-tools">
        <button v-for="action in editActions" :key="action.key" type="button" :data-action="action.key" :data-tooltip="action.label" :aria-label="action.label">
          <AppIcon :name="action.icon" />
        </button>
      </div>
      <div class="timeline-tool-group clip-tools">
        <button v-for="action in clipActions" :key="action.key" type="button" :data-action="action.key" :data-tooltip="action.label" :aria-label="action.label" :aria-pressed="action.pressed">
          <AppIcon :name="action.icon" />
        </button>
      </div>
      <div class="timeline-tool-group range-tools">
        <button v-for="action in rangeActions" :key="action.key" type="button" :data-action="action.key" :data-tooltip="action.label" :aria-label="action.label">
          <AppIcon :name="action.icon" />
        </button>
      </div>
      <div class="timeline-tool-group marker-tools">
        <button id="addMarker" type="button" data-tooltip="Adicionar marcador" aria-label="Adicionar marcador"><AppIcon name="bookmark-add" /></button>
        <button id="clearMarkers" type="button" data-tooltip="Limpar marcadores" aria-label="Limpar marcadores"><AppIcon name="bookmark-remove" /></button>
        <button type="button" data-tool="beats" data-tooltip="Gerar marcadores em uma grade de tempo" aria-label="Gerar marcadores em uma grade de tempo"><AppIcon name="music-note" /></button>
      </div>
      <div class="timeline-tool-group view-tools">
        <label class="snap-toggle" data-tooltip="Encaixe magnético">
          <input id="snapTimeline" type="checkbox" checked aria-label="Encaixe magnético">
          <AppIcon name="align-horizontal-center" />
        </label>
        <button type="button" data-zoom-factor="0.8" data-tooltip="Diminuir zoom" aria-label="Diminuir zoom"><AppIcon name="zoom-out" /></button>
        <label class="zoom-control" data-tooltip="Zoom · Alt ou Shift + roda do mouse">
          <span>Zoom</span>
          <input id="timelineZoom" type="range" min=".25" max="5" step=".05" value="1" aria-label="Zoom da timeline">
        </label>
        <button type="button" data-zoom-factor="1.25" data-tooltip="Aumentar zoom" aria-label="Aumentar zoom"><AppIcon name="zoom-in" /></button>
      </div>
      <div class="timeline-tool-group timeline-status">
        <output class="render-range-status" />
        <output id="timelinePosition" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-controls{flex-shrink:0;height:auto;min-height:0;padding:1rem 16px;display:flex;align-items:center;overflow-x:auto;overflow-y:hidden;background:var(--panel);border:solid var(--line);border-width:0 0 1px;font-size:12px}
.timeline-edit-tools{width:100%;min-height:32px;display:flex;align-items:center;flex-wrap:nowrap;gap:0}
.timeline-tool-group{height:32px;display:flex;align-items:center;flex:0 0 auto;gap:4px;padding:0 8px;border-left:1px solid var(--line);color:var(--text)}
.timeline-tool-group:first-child{padding-left:0;border-left:0}.range-tools{gap:3px}.marker-tools{gap:5px}.view-tools{gap:4px}.timeline-status{margin-left:auto;padding-right:0;color:var(--muted)}
button,.snap-toggle{width:32px;height:32px;min-width:32px;display:grid;place-items:center;padding:0;border:1px solid transparent;border-radius:6px;background:transparent;color:#a4a4a8;cursor:pointer}
button:hover,.snap-toggle:hover{background:var(--hover);color:var(--text)}button[aria-pressed=true],.snap-toggle:has(input:checked){background:#143c43;border-color:#08dfdc;color:#37d3eb}
.snap-toggle{position:relative}.snap-toggle input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:pointer}
.zoom-control{display:flex;align-items:center}.zoom-control span{font-size:0}.zoom-control input{width:80px;height:3px;accent-color:#77777d}
output{font-variant-numeric:tabular-nums;white-space:nowrap;font-size:12px;color:var(--muted);font-weight:500}.render-range-status{color:var(--muted)}#timelinePosition{min-width:142px;text-align:right}
</style>
