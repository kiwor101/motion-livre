<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

interface LayerPanelItem {
  id: string | number
  layerId: number
  title: string
  active: boolean
  locked: boolean
}

const items = ref<LayerPanelItem[]>([])
const editingId = ref<string | number | null>(null)
const editingTitle = ref('')
const panelRoot = ref<HTMLElement | null>(null)
const dropTargetId = ref<string | number | null>(null)

function updateItems(event: Event) {
  items.value = (event as CustomEvent<LayerPanelItem[]>).detail
  if (editingId.value && !items.value.some(item => item.id === editingId.value)) editingId.value = null
}

function emitAction(action: string, detail: Record<string, unknown>) {
  window.dispatchEvent(new CustomEvent('motion:layers-panel-action', { detail: { action, ...detail } }))
}

function select(item: LayerPanelItem) {
  emitAction('select', { layerId: item.layerId })
}

async function beginRename(item: LayerPanelItem) {
  if (item.locked) return
  editingId.value = item.id
  editingTitle.value = item.title
  await nextTick()
  const input = panelRoot.value?.querySelector<HTMLInputElement>('.track-rename')
  input?.focus()
  input?.select()
}

function finishRename(item: LayerPanelItem, save: boolean) {
  if (editingId.value !== item.id) return
  editingId.value = null
  const title = editingTitle.value.trim()
  if (save && title) emitAction('rename', { id: item.id, title })
}

function startDrag(event: DragEvent, item: LayerPanelItem) {
  if (item.locked) return event.preventDefault()
  event.dataTransfer?.setData('application/x-motion-track', String(item.id))
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function allowDrop(event: DragEvent) {
  if (event.dataTransfer?.types.includes('application/x-motion-track')) event.preventDefault()
}

function drop(event: DragEvent, target: LayerPanelItem) {
  event.preventDefault()
  dropTargetId.value = null
  const sourceToken = event.dataTransfer?.getData('application/x-motion-track')
  const source = items.value.find(item => String(item.id) === sourceToken)
  if (!source || source.id === target.id) return
  const element = event.currentTarget as HTMLElement
  emitAction('reorder', { source: source.id, target: target.id, before: event.clientY < element.getBoundingClientRect().top + element.clientHeight / 2 })
}

onMounted(() => window.addEventListener('motion:layers-panel-update', updateItems))
onBeforeUnmount(() => window.removeEventListener('motion:layers-panel-update', updateItems))
</script>

<template>
  <details ref="panelRoot" class="layers-panel" open>
    <summary>Camadas</summary>
    <div class="layers-panel-list">
      <div
        v-for="item in items"
        :key="item.id"
        class="panel-layer"
        :class="{ active: item.active, 'track-reorder-target': dropTargetId === item.id }"
        draggable="true"
        @click="select(item)"
        @dblclick.stop="beginRename(item)"
        @dragstart="startDrag($event, item)"
        @dragover="allowDrop"
        @dragenter="dropTargetId = item.id"
        @dragleave="dropTargetId = null"
        @drop.stop="drop($event, item)"
      >
        <input
          v-if="editingId === item.id"
          v-model="editingTitle"
          class="track-rename"
          @click.stop
          @keydown.enter.stop="finishRename(item, true)"
          @keydown.esc.stop="finishRename(item, false)"
          @blur="finishRename(item, true)"
        >
        <span v-else class="layer-title" title="Duplo clique para renomear; arraste para reordenar">{{ item.title }}</span>
      </div>
    </div>
  </details>
</template>

<style scoped>
.layers-panel {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}

.layers-panel summary {
  padding-block: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.panel-layer {
  padding: 16px;
  overflow: hidden;
  border: solid var(--line);
  border-width: 0 0 1px;
  background: var(--panel2);
  font-size: 12px;
  cursor: grab;
}

.panel-layer.active {
  outline: 1px solid var(--accent);
  outline-offset: -1px;
}

.panel-layer.track-reorder-target {
  box-shadow: inset 0 2px var(--accent), inset 0 -2px var(--accent);
}

.layer-title {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-rename {
  width: 100%;
  min-width: 0;
  padding: 4px;
  border: 1px solid var(--accent);
  border-radius: 4px;
  background: var(--bg);
  color: var(--text);
}
</style>
